import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { SPOTIFY_CLIENT_ID, API_BASE_URL } from '../config/constants';

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export const useSpotifyAuth = () => {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'chord',
    path: 'spotify-auth',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: [
        'user-top-read',
        'user-read-recently-played',
        'user-read-private',
        'user-read-email',
      ],
      usePKCE: false,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  return { request, response, promptAsync, redirectUri };
};

/**
 * Exchange Spotify code for app token via backend
 */
export const exchangeSpotifyCode = async (code: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/spotify/callback?code=${code}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error exchanging Spotify code:', error);
    throw error;
  }
};

