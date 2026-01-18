# Spotify API Integration Guide

This document provides detailed information about how Chord integrates with the Spotify Web API.

## 📋 Table of Contents

1. [Spotify Developer Setup](#spotify-developer-setup)
2. [OAuth Flow](#oauth-flow)
3. [API Endpoints Used](#api-endpoints-used)
4. [Data Collection & Privacy](#data-collection--privacy)
5. [Token Management](#token-management)
6. [Rate Limits](#rate-limits)

## 🎯 Spotify Developer Setup

### Step 1: Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **"Create an App"**
3. Fill in:
   - **App Name**: Chord
   - **App Description**: Music-based social discovery application
   - **Website**: Your website URL (optional)
   - **Redirect URI**: 
     - For backend: `http://localhost:3000/auth/spotify/callback`
     - For mobile: `chord://spotify-auth`
     - For production: `https://your-api.com/auth/spotify/callback`

### Step 2: Get Credentials

After creating the app, you'll receive:
- **Client ID**: Public identifier for your app
- **Client Secret**: Keep this secret! Only use in backend

### Step 3: Required Scopes

Chord requires the following Spotify scopes:

| Scope | Purpose | Required? |
|-------|---------|-----------|
| `user-top-read` | Get user's top tracks and artists | ✅ Yes |
| `user-read-recently-played` | Get recently played tracks | ✅ Yes |
| `user-read-private` | Get user profile information | ✅ Yes |
| `user-read-email` | Get user's email address | ✅ Yes |

**Note**: All scopes are required for the app to function properly.

## 🔐 OAuth Flow

### Authorization Code Flow

Chord uses the **Authorization Code Flow** for OAuth:

```
1. User clicks "Connect with Spotify"
   ↓
2. App redirects to Spotify authorization URL
   ↓
3. User authorizes app on Spotify
   ↓
4. Spotify redirects back with authorization code
   ↓
5. Backend exchanges code for access + refresh tokens
   ↓
6. Backend stores tokens securely
   ↓
7. Backend generates JWT token for app
   ↓
8. User is authenticated in Chord
```

### Authorization URL

**Endpoint**: `https://accounts.spotify.com/authorize`

**Parameters**:
- `client_id`: Your Spotify Client ID
- `response_type`: `code`
- `redirect_uri`: Must match exactly with registered URI
- `scope`: Space-separated list of scopes
- `state`: Optional CSRF protection token

**Example**:
```
https://accounts.spotify.com/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  redirect_uri=http://localhost:3000/auth/spotify/callback&
  scope=user-top-read%20user-read-recently-played%20user-read-private%20user-read-email
```

### Token Exchange

**Endpoint**: `POST https://accounts.spotify.com/api/token`

**Headers**:
```
Content-Type: application/x-www-form-urlencoded
```

**Body**:
```
grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=REDIRECT_URI
&client_id=CLIENT_ID
&client_secret=CLIENT_SECRET
```

**Response**:
```json
{
  "access_token": "BQC...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "AQD...",
  "scope": "user-top-read user-read-recently-played ..."
}
```

## 📡 API Endpoints Used

### 1. Get User Profile

**Endpoint**: `GET https://api.spotify.com/v1/me`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "id": "spotify_user_id",
  "display_name": "User Name",
  "email": "user@example.com",
  "images": [
    {
      "url": "https://i.scdn.co/image/...",
      "height": 640,
      "width": 640
    }
  ],
  "followers": {
    "total": 100
  }
}
```

**Used for**: Getting user's basic profile information during signup.

---

### 2. Get User's Top Tracks

**Endpoint**: `GET https://api.spotify.com/v1/me/top/tracks`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `limit`: Number of tracks (1-50, default: 20)
- `time_range`: `short_term` (4 weeks), `medium_term` (6 months), `long_term` (all time)

**Response**:
```json
{
  "items": [
    {
      "id": "track_id",
      "name": "Track Name",
      "artists": [
        {
          "id": "artist_id",
          "name": "Artist Name"
        }
      ],
      "album": {
        "id": "album_id",
        "name": "Album Name",
        "images": [...]
      },
      "popularity": 85
    }
  ]
}
```

**Used for**: 
- Generating music embeddings
- Displaying top tracks on profile
- Finding shared tracks between users

**Implementation**: We fetch top 50 tracks with `medium_term` time range.

---

### 3. Get User's Top Artists

**Endpoint**: `GET https://api.spotify.com/v1/me/top/artists`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `limit`: Number of artists (1-50, default: 20)
- `time_range`: `short_term`, `medium_term`, `long_term`

**Response**:
```json
{
  "items": [
    {
      "id": "artist_id",
      "name": "Artist Name",
      "genres": ["indie rock", "alternative"],
      "images": [
        {
          "url": "https://i.scdn.co/image/...",
          "height": 640,
          "width": 640
        }
      ],
      "popularity": 90
    }
  ]
}
```

**Used for**:
- Generating genre vectors for embeddings
- Displaying top artists on profile
- Finding shared artists between users (conversation starters)

**Implementation**: We fetch top 50 artists with `medium_term` time range.

---

### 4. Get Audio Features

**Endpoint**: `GET https://api.spotify.com/v1/audio-features`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `ids`: Comma-separated list of track IDs (max 100)

**Response**:
```json
{
  "audio_features": [
    {
      "id": "track_id",
      "danceability": 0.735,
      "energy": 0.578,
      "key": 5,
      "loudness": -11.84,
      "mode": 0,
      "speechiness": 0.0461,
      "acousticness": 0.514,
      "instrumentalness": 0.0902,
      "liveness": 0.159,
      "valence": 0.624,
      "tempo": 98.002,
      "duration_ms": 255349,
      "time_signature": 4
    }
  ]
}
```

**Audio Features Explained**:
- **valence**: Musical positiveness (0.0 = sad, 1.0 = happy)
- **energy**: Perceptual intensity (0.0 = calm, 1.0 = energetic)
- **danceability**: Suitability for dancing (0.0 = not danceable, 1.0 = very danceable)
- **acousticness**: Confidence measure of whether track is acoustic (0.0 = not acoustic, 1.0 = acoustic)
- **instrumentalness**: Predicts whether track contains no vocals (0.0 = vocal, 1.0 = instrumental)
- **tempo**: Overall estimated tempo in BPM
- **loudness**: Overall loudness in decibels (typically -60 to 0)

**Used for**: Generating 7-dimensional audio feature vector for music embeddings.

**Implementation**: We fetch audio features for all top 50 tracks, then average them.

---

### 5. Get Recently Played Tracks

**Endpoint**: `GET https://api.spotify.com/v1/me/player/recently-played`

**Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `limit`: Number of tracks (1-50, default: 20)
- `after`: Unix timestamp in milliseconds (optional)
- `before`: Unix timestamp in milliseconds (optional)

**Response**:
```json
{
  "items": [
    {
      "track": {
        "id": "track_id",
        "name": "Track Name",
        "artists": [...],
        "album": {...}
      },
      "played_at": "2026-01-07T12:00:00.000Z"
    }
  ],
  "next": "https://api.spotify.com/v1/me/player/recently-played?before=..."
}
```

**Used for**: 
- Analyzing recent listening patterns (optional)
- Not stored in database (privacy-first approach)

**Note**: We fetch this data but don't store timestamped history per PRD requirements.

---

### 6. Refresh Access Token

**Endpoint**: `POST https://accounts.spotify.com/api/token`

**Headers**:
```
Content-Type: application/x-www-form-urlencoded
```

**Body**:
```
grant_type=refresh_token
&refresh_token=REFRESH_TOKEN
&client_id=CLIENT_ID
&client_secret=CLIENT_SECRET
```

**Response**:
```json
{
  "access_token": "NEW_ACCESS_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "..."
}
```

**Used for**: Refreshing expired access tokens automatically.

**Implementation**: We check token expiration before each API call and refresh if needed.

## 🔒 Data Collection & Privacy

### What We Store

✅ **Stored**:
- Top 10 artists (name, Spotify ID, image, genres)
- Top 5 genres with weights
- Top 5 tracks (name, artist, Spotify ID)
- 17-dimensional music embedding vector
- Last sync timestamp

❌ **NOT Stored**:
- Raw listening history
- Timestamped play events
- Recently played tracks (fetched on-demand only)
- Skip/replay behavior
- Exact play counts
- Listening duration per track
- Playlist contents

### Privacy Principles

1. **Aggregated Data Only**: We only store aggregated statistics, not individual listening events
2. **No Behavioral Tracking**: No timestamps or listening patterns stored
3. **User Control**: Users can delete all data at any time
4. **Transparent**: Clear consent screens explaining what data is collected
5. **Minimal Storage**: Only data necessary for matching is stored

## 🔄 Token Management

### Token Storage

**Backend**: Tokens stored in `spotify_tokens` table:
- `access_token`: Encrypted (recommended for production)
- `refresh_token`: Encrypted
- `expires_at`: Timestamp for expiration check

**Security**: 
- Never expose tokens to frontend
- Use environment variables for secrets
- Encrypt tokens in database (production)

### Token Refresh Strategy

```typescript
// Pseudo-code
async function getValidToken(userId: string) {
  const tokens = await getTokensFromDB(userId);
  
  // Check if token expires in next 5 minutes
  if (tokens.expires_at > now + 5 minutes) {
    return tokens.access_token;
  }
  
  // Refresh token
  const newTokens = await spotifyService.refreshAccessToken(
    tokens.refresh_token
  );
  
  // Update database
  await updateTokens(userId, newTokens);
  
  return newTokens.access_token;
}
```

### Error Handling

- **401 Unauthorized**: Token expired → Refresh and retry
- **403 Forbidden**: Invalid token → Re-authenticate user
- **429 Too Many Requests**: Rate limit hit → Implement exponential backoff

## ⚠️ Rate Limits

### Spotify API Rate Limits

- **General API**: 30,000 requests per hour per user
- **Audio Features**: 100 track IDs per request
- **Top Tracks/Artists**: 50 items per request

### Best Practices

1. **Cache Results**: Music embeddings don't change frequently
2. **Batch Requests**: Fetch audio features for multiple tracks at once
3. **Refresh Weekly**: Don't sync Spotify data daily (PRD: weekly refresh)
4. **Error Handling**: Implement exponential backoff for rate limits

### Implementation in Chord

- **Initial Sync**: Fetches all data during onboarding
- **Manual Sync**: User can trigger sync from profile
- **Automatic Sync**: Weekly background sync (optional)
- **Caching**: Embeddings cached until next sync

## 🧪 Testing Spotify Integration

### Test Accounts

1. Create a test Spotify account
2. Listen to diverse music to generate data
3. Use Spotify Developer Dashboard to test API calls

### Testing Checklist

- [ ] OAuth flow works end-to-end
- [ ] Token exchange successful
- [ ] Top tracks fetched correctly
- [ ] Top artists fetched correctly
- [ ] Audio features retrieved
- [ ] Token refresh works
- [ ] Error handling for expired tokens
- [ ] Rate limit handling

### Debugging Tips

1. **Check Token Validity**: Use Spotify's token validation endpoint
2. **Log API Responses**: Inspect data structure
3. **Test with Postman**: Verify API calls work independently
4. **Check Scopes**: Ensure all required scopes are granted
5. **Verify Redirect URI**: Must match exactly

## 📚 Additional Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Authorization Guide](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [Rate Limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)
- [Audio Features Guide](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)

---

**Last Updated**: January 2026

