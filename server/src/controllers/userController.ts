import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { spotifyService } from '../services/spotifyService';
import { authController } from './authController';

export class UserController {
  /**
   * Get current user profile
   */
  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove sensitive data
      const { music_embedding, ...userData } = user;

      res.json(userData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { display_name, bio, profile_photo_url } = req.body;

      const updates: any = {};
      if (display_name !== undefined) updates.display_name = display_name;
      if (bio !== undefined) {
        if (bio.length > 50) {
          return res.status(400).json({ error: 'Bio must be 50 characters or less' });
        }
        updates.bio = bio;
      }
      if (profile_photo_url !== undefined) updates.profile_photo_url = profile_photo_url;

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update user location
   */
  async updateLocation(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { latitude, longitude } = req.body;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Valid latitude and longitude required' });
      }

      // Round to ~1km precision
      const roundedLat = Math.round(latitude * 100) / 100;
      const roundedLng = Math.round(longitude * 100) / 100;

      // Create geography point
      const location = `POINT(${roundedLng} ${roundedLat})`;

      const { data, error } = await supabase
        .from('users')
        .update({
          location,
          last_location_update: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, location: { latitude: roundedLat, longitude: roundedLng } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user's music taste data
   */
  async getMusicTaste(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      const { data: user, error } = await supabase
        .from('users')
        .select('top_artists, top_genres, top_tracks, last_spotify_sync')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Manually trigger Spotify data sync
   */
  async syncSpotify(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      // Get user's Spotify tokens
      const { data: tokens, error: tokenError } = await supabase
        .from('spotify_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (tokenError || !tokens) {
        return res.status(404).json({ error: 'Spotify tokens not found' });
      }

      // Check if token needs refresh
      let accessToken = tokens.access_token;
      if (new Date(tokens.expires_at) <= new Date()) {
        const refreshed = await spotifyService.refreshAccessToken(tokens.refresh_token);
        accessToken = refreshed.access_token;

        // Update token in database
        await supabase
          .from('spotify_tokens')
          .update({
            access_token: accessToken,
            expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          })
          .eq('user_id', userId);
      }

      // Sync Spotify data
      await authController.syncSpotifyData(userId, accessToken);

      res.json({ success: true, message: 'Spotify data synced successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const userController = new UserController();

