import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

export class ChatController {
  /**
   * Get messages for a match
   */
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { matchId } = req.params;

      // Verify user is part of this match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      if (match.user1_id !== userId && match.user2_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Send a message
   */
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { matchId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content required' });
      }

      // Verify user is part of this match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id, is_active')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      if (match.user1_id !== userId && match.user2_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (!match.is_active) {
        return res.status(400).json({ error: 'Match is no longer active' });
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: userId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Request identity reveal
   */
  async requestReveal(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { matchId } = req.params;

      // Verify user is part of this match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id, identities_revealed')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      if (match.user1_id !== userId && match.user2_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (match.identities_revealed) {
        return res.status(400).json({ error: 'Identities already revealed' });
      }

      const { error } = await supabase
        .from('matches')
        .update({
          reveal_requested_by: userId,
          reveal_requested_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, message: 'Reveal request sent' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Accept identity reveal
   */
  async acceptReveal(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { matchId } = req.params;

      // Verify user is part of this match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id, reveal_requested_by, identities_revealed')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      if (match.user1_id !== userId && match.user2_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (match.identities_revealed) {
        return res.status(400).json({ error: 'Identities already revealed' });
      }

      if (!match.reveal_requested_by || match.reveal_requested_by === userId) {
        return res.status(400).json({ error: 'No reveal request pending' });
      }

      // Mark identities as revealed
      const { error } = await supabase
        .from('matches')
        .update({
          identities_revealed: true,
          user1_revealed: true,
          user2_revealed: true,
        })
        .eq('id', matchId);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, message: 'Identities revealed' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const chatController = new ChatController();

