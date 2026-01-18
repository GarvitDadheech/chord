// API Configuration
// For development, use your local IP address instead of localhost
// Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
export const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://10.51.13.249:3000' // Your local IP address for mobile device/emulator access
  : 'https://your-production-api.com';

// Spotify Configuration
export const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'; // Replace with your Spotify Client ID

// Supabase Configuration
export const SUPABASE_URL = 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@chord:auth_token',
  USER_ID: '@chord:user_id',
  SPOTIFY_CODE: '@chord:spotify_code',
};

