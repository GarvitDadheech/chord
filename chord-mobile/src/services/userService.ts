import api from './api';

export interface User {
  id: string;
  spotify_id: string;
  display_name: string | null;
  email: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  top_artists: Array<{
    name: string;
    spotify_id: string;
    image: string | null;
  }>;
  top_genres: Array<{
    name: string;
    weight: number;
  }>;
  top_tracks: Array<{
    name: string;
    artist: string;
    spotify_id: string;
  }>;
  last_spotify_sync: string | null;
}

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get('/api/users/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (updates: {
  display_name?: string;
  bio?: string;
  profile_photo_url?: string;
}): Promise<User> => {
  try {
    const response = await api.put('/api/users/me', updates);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Get user's music taste
 */
export const getMusicTaste = async (): Promise<{
  top_artists: any[];
  top_genres: any[];
  top_tracks: any[];
  last_spotify_sync: string | null;
}> => {
  try {
    const response = await api.get('/api/users/me/music-taste');
    return response.data;
  } catch (error) {
    console.error('Error fetching music taste:', error);
    throw error;
  }
};

/**
 * Sync Spotify data
 */
export const syncSpotify = async (): Promise<boolean> => {
  try {
    const response = await api.post('/api/users/me/sync-spotify');
    return response.status === 200;
  } catch (error) {
    console.error('Error syncing Spotify:', error);
    throw error;
  }
};

