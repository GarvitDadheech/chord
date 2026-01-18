import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

export class MatchController {
  /**
   * Get today's match for current user
   */
  async getTodayMatch(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const today = new Date().toISOString().split('T')[0];

      const { data: match, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:users!matches_user1_id_fkey(id, display_name, profile_photo_url, top_artists, top_genres),
          user2:users!matches_user2_id_fkey(id, display_name, profile_photo_url, top_artists, top_genres)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('created_at', today)
        .eq('is_active', true)
        .single();

      if (error || !match) {
        return res.status(404).json({ error: 'No match found for today' });
      }

      // Determine the other user
      const otherUser = match.user1_id === userId ? match.user2 : match.user1;
      const isRevealed = match.identities_revealed;

      // Calculate shared artists and genres
      const user1Artists = match.user1?.top_artists || [];
      const user2Artists = match.user2?.top_artists || [];
      const sharedArtists = this.findSharedItems(
        user1Artists.map((a: any) => a.spotify_id),
        user2Artists.map((a: any) => a.spotify_id),
        user1Artists,
        user2Artists
      );

      const user1Genres = match.user1?.top_genres || [];
      const user2Genres = match.user2?.top_genres || [];
      const sharedGenres = this.findSharedItems(
        user1Genres.map((g: any) => g.name),
        user2Genres.map((g: any) => g.name),
        user1Genres,
        user2Genres
      );

      res.json({
        id: match.id,
        match_score: match.match_score,
        music_similarity: match.music_similarity,
        distance_km: match.distance_km,
        identities_revealed: isRevealed,
        reveal_requested: match.reveal_requested_by === userId,
        other_user: isRevealed
          ? {
              id: otherUser.id,
              display_name: otherUser.display_name,
              profile_photo_url: otherUser.profile_photo_url,
            }
          : {
              id: `music_lover_${otherUser.id.slice(0, 8)}`,
              display_name: null,
              profile_photo_url: null,
            },
        shared_artists: sharedArtists.slice(0, 3),
        shared_genres: sharedGenres.slice(0, 3),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get match history
   */
  async getMatchHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 30;

      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:users!matches_user1_id_fkey(id, display_name, profile_photo_url),
          user2:users!matches_user2_id_fkey(id, display_name, profile_photo_url)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const formattedMatches = matches.map((match) => {
        const otherUser = match.user1_id === userId ? match.user2 : match.user1;
        return {
          id: match.id,
          created_at: match.created_at,
          music_similarity: match.match_similarity,
          identities_revealed: match.identities_revealed,
          other_user: match.identities_revealed
            ? {
                id: otherUser.id,
                display_name: otherUser.display_name,
                profile_photo_url: otherUser.profile_photo_url,
              }
            : {
                id: `music_lover_${otherUser.id.slice(0, 8)}`,
              },
        };
      });

      res.json(formattedMatches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Report a match/user
   */
  async reportMatch(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { matchId } = req.params;
      const { reason } = req.body;

      // Get match to find the other user
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      const reportedUserId =
        match.user1_id === userId ? match.user2_id : match.user1_id;

      const { error } = await supabase.from('reports').insert({
        reporter_id: userId,
        reported_id: reportedUserId,
        match_id: matchId,
        reason: reason || 'other',
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Block a user
   */
  async blockUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { matchId } = req.params;

      // Get match to find the other user
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      const blockedUserId =
        match.user1_id === userId ? match.user2_id : match.user1_id;

      // Insert block (upsert to handle duplicates)
      const { error: blockError } = await supabase
        .from('blocks')
        .upsert(
          {
            blocker_id: userId,
            blocked_id: blockedUserId,
          },
          { onConflict: 'blocker_id,blocked_id' }
        );

      if (blockError) {
        return res.status(400).json({ error: blockError.message });
      }

      // Deactivate the match
      await supabase
        .from('matches')
        .update({ is_active: false })
        .eq('id', matchId);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Helper to find shared items between two arrays
   */
  private findSharedItems(
    ids1: string[],
    ids2: string[],
    items1: any[],
    items2: any[]
  ): any[] {
    const sharedIds = ids1.filter((id) => ids2.includes(id));
    const sharedItems = sharedIds.map((id) => {
      const item1 = items1.find((item: any) =>
        item.spotify_id ? item.spotify_id === id : item.name === id
      );
      const item2 = items2.find((item: any) =>
        item.spotify_id ? item.spotify_id === id : item.name === id
      );
      return item1 || item2;
    });
    return sharedItems;
  }
}

export const matchController = new MatchController();

