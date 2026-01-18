import api from './api';

export interface Match {
  id: string;
  match_score: number;
  music_similarity: number;
  distance_km: number;
  identities_revealed: boolean;
  reveal_requested: boolean;
  other_user: {
    id: string;
    display_name: string | null;
    profile_photo_url: string | null;
  };
  shared_artists: Array<{
    name: string;
    spotify_id: string;
    image: string | null;
  }>;
  shared_genres: Array<{
    name: string;
    weight: number;
  }>;
}

/**
 * Get today's match
 */
export const getTodayMatch = async (): Promise<Match | null> => {
  try {
    const response = await api.get('/api/matches/today');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No match today
    }
    console.error('Error fetching today\'s match:', error);
    throw error;
  }
};

/**
 * Get match history
 */
export const getMatchHistory = async (limit: number = 30): Promise<Match[]> => {
  try {
    const response = await api.get(`/api/matches/history?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching match history:', error);
    throw error;
  }
};

/**
 * Report a match/user
 */
export const reportMatch = async (
  matchId: string,
  reason: string = 'other'
): Promise<boolean> => {
  try {
    const response = await api.post(`/api/matches/${matchId}/report`, {
      reason,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Error reporting match:', error);
    throw error;
  }
};

/**
 * Block a user
 */
export const blockUser = async (matchId: string): Promise<boolean> => {
  try {
    const response = await api.post(`/api/matches/${matchId}/block`);
    return response.status === 200;
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

