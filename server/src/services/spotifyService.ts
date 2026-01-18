import axios, { AxiosInstance } from 'axios';

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    images: Array<{ url: string }>;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: Array<{ url: string }>;
}

export interface SpotifyAudioFeatures {
  id: string;
  valence: number;
  energy: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  tempo: number;
  loudness: number;
}

interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private apiClient: AxiosInstance;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID!;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Missing Spotify credentials');
    }

    this.apiClient = axios.create({
      baseURL: 'https://api.spotify.com/v1',
    });
  }

  /**
   * Get Spotify OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: [
        'user-top-read',
        'user-read-recently-played',
        'user-read-private',
        'user-read-email',
      ].join(' '),
      ...(state && { state }),
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCode(code: string): Promise<SpotifyTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    try {
      const response = await axios.post<SpotifyTokenResponse>(
        'https://accounts.spotify.com/api/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to exchange code: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ access_token: string; expires_in: number }> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    try {
      const response = await axios.post<SpotifyTokenResponse>(
        'https://accounts.spotify.com/api/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in || 3600,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to refresh token: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Get user's top tracks
   * @param accessToken Spotify access token
   * @param limit Number of tracks (max 50)
   * @param timeRange 'short_term' (4 weeks), 'medium_term' (6 months), 'long_term' (all time)
   */
  async getTopTracks(
    accessToken: string,
    limit: number = 50,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
  ): Promise<SpotifyTrack[]> {
    try {
      const response = await this.apiClient.get<{ items: SpotifyTrack[] }>(
        '/me/top/tracks',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            limit,
            time_range: timeRange,
          },
        }
      );

      return response.data.items;
    } catch (error: any) {
      throw new Error(
        `Failed to get top tracks: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Get user's top artists
   */
  async getTopArtists(
    accessToken: string,
    limit: number = 50,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
  ): Promise<SpotifyArtist[]> {
    try {
      const response = await this.apiClient.get<{ items: SpotifyArtist[] }>(
        '/me/top/artists',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            limit,
            time_range: timeRange,
          },
        }
      );

      return response.data.items;
    } catch (error: any) {
      throw new Error(
        `Failed to get top artists: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Get audio features for multiple tracks
   * @param accessToken Spotify access token
   * @param trackIds Array of track IDs (max 100)
   */
  async getAudioFeatures(
    accessToken: string,
    trackIds: string[]
  ): Promise<SpotifyAudioFeatures[]> {
    if (trackIds.length === 0) return [];
    if (trackIds.length > 100) {
      throw new Error('Maximum 100 track IDs allowed per request');
    }

    try {
      const response = await this.apiClient.get<{
        audio_features: (SpotifyAudioFeatures | null)[];
      }>('/audio-features', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          ids: trackIds.join(','),
        },
      });

      // Filter out null values (tracks without audio features)
      return response.data.audio_features.filter(
        (features): features is SpotifyAudioFeatures => features !== null
      );
    } catch (error: any) {
      throw new Error(
        `Failed to get audio features: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Get user's recently played tracks
   */
  async getRecentlyPlayed(
    accessToken: string,
    limit: number = 50
  ): Promise<SpotifyTrack[]> {
    try {
      const response = await this.apiClient.get<{
        items: Array<{ track: SpotifyTrack }>;
      }>('/me/player/recently-played', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          limit,
        },
      });

      return response.data.items.map((item) => item.track);
    } catch (error: any) {
      throw new Error(
        `Failed to get recently played: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
    try {
      const response = await this.apiClient.get<SpotifyUserProfile>('/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to get user profile: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Get valid access token (auto-refresh if needed)
   */
  async getValidAccessToken(
    userId: string,
    currentToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    if (new Date() < new Date(expiresAt.getTime() - 5 * 60 * 1000)) {
      return currentToken;
    }

    // Refresh token
    const { access_token, expires_in } = await this.refreshAccessToken(
      refreshToken
    );

    // Update token in database (this should be done in the calling service)
    return access_token;
  }
}

export const spotifyService = new SpotifyService();

