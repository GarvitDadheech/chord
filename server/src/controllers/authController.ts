import { Request, Response } from 'express';
import { spotifyService } from '../services/spotifyService';
import { supabase } from '../config/supabase';
import { generateToken } from '../middleware/auth';
import { embeddingService } from '../services/embeddingService';
import logger from '../config/logger';

export class AuthController {
  /**
   * Get Spotify OAuth authorization URL
   */
  async getAuthorizationUrl(req: Request, res: Response) {
    try {
      const state = req.query.state as string | undefined;
      const authUrl = spotifyService.getAuthorizationUrl(state);
      res.json({ authUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Handle Spotify OAuth callback
   * Exchange code for tokens, create/update user, fetch Spotify data
   */
  async handleCallback(req: Request, res: Response) {
    try {
      const { code, error } = req.query;

      if (error) {
        return res.status(400).json({ error: 'Spotify authorization failed' });
      }

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      // Exchange code for tokens
      const tokenData = await spotifyService.exchangeCode(code);
      const expiresAt = new Date(
        Date.now() + tokenData.expires_in * 1000
      );

      // Get user profile from Spotify
      const spotifyProfile = await spotifyService.getUserProfile(
        tokenData.access_token
      );

      // Check if user exists
      let { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('spotify_id', spotifyProfile.id)
        .single();

      let userId: string;

      if (existingUser) {
        // Update existing user
        userId = existingUser.id;
        await supabase
          .from('users')
          .update({
            email: spotifyProfile.email,
            display_name: spotifyProfile.display_name || null,
            profile_photo_url: spotifyProfile.images[0]?.url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            spotify_id: spotifyProfile.id,
            email: spotifyProfile.email,
            display_name: spotifyProfile.display_name || null,
            profile_photo_url: spotifyProfile.images[0]?.url || null,
          })
          .select('id')
          .single();

        if (createError || !newUser) {
          throw new Error('Failed to create user');
        }

        userId = newUser.id;
      }

      // Store/update Spotify tokens
      await supabase
        .from('spotify_tokens')
        .upsert(
          {
            user_id: userId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: 'user_id' }
        );

      // Fetch and process Spotify data
      await this.syncSpotifyData(userId, tokenData.access_token);

      // Generate JWT token
      const jwtToken = generateToken(userId);

      res.json({
        token: jwtToken,
        user: {
          id: userId,
          spotify_id: spotifyProfile.id,
          display_name: spotifyProfile.display_name,
          email: spotifyProfile.email,
        },
      });
    } catch (error: any) {
      logger.error('Auth callback error:', { error: error.message, stack: error.stack });
      res.status(500).json({ error: error.message || 'Authentication failed' });
    }
  }

  /**
   * Sync Spotify data for a user
   */
  async syncSpotifyData(userId: string, accessToken: string) {
    try {
      // Fetch top tracks and artists
      const [topTracks, topArtists] = await Promise.all([
        spotifyService.getTopTracks(accessToken, 50, 'medium_term'),
        spotifyService.getTopArtists(accessToken, 50, 'medium_term'),
      ]);

      // Get audio features for top tracks
      const trackIds = topTracks.map((track) => track.id);
      const audioFeatures = await spotifyService.getAudioFeatures(
        accessToken,
        trackIds
      );

      // Generate music embedding
      const musicData = await embeddingService.generateMusicEmbedding(
        topTracks,
        topArtists,
        audioFeatures
      );

      // Convert embedding array to PostgreSQL vector format
      const embeddingString = `[${musicData.embedding.join(',')}]`;

      // Update user with music data
      const { error } = await supabase
        .from('users')
        .update({
          music_embedding: embeddingString,
          top_artists: musicData.topArtists,
          top_genres: musicData.topGenres,
          top_tracks: musicData.topTracks,
          last_spotify_sync: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update user music data: ${error.message}`);
      }
      
      logger.info('Spotify data synced successfully', { userId });
    } catch (error: any) {
      logger.error('Spotify sync error:', { error: error.message, stack: error.stack, userId });
      throw error;
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      // In a real implementation, you might want to use refresh tokens
      // For now, we'll just validate the existing token
      const jwt = require('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET!;

      try {
        const decoded = jwt.verify(token, jwtSecret) as { userId: string };
        const newToken = generateToken(decoded.userId);
        res.json({ token: newToken });
      } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();

