# Chord Backend API

Backend server for Chord - Music-based social discovery application.

## Overview

The backend is built with Node.js, TypeScript, and Express.js. It handles authentication, user management, matchmaking, and real-time chat functionality.

## Tech Stack

- Node.js with TypeScript
- Express.js
- Supabase (PostgreSQL with pgvector extension)
- JWT Authentication
- Spotify Web API
- Winston Logger
- node-cron (daily matching)

## Setup

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Setup

1. Run the SQL schema from `src/config/database.sql` in Supabase SQL Editor
2. Ensure extensions are enabled:
   - uuid-ossp
   - vector (for pgvector)
   - postgis (for location queries)

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

#### GET /auth/spotify/authorize
Get Spotify OAuth authorization URL.

**Response:**
```json
{
  "authUrl": "https://accounts.spotify.com/authorize?..."
}
```

#### GET /auth/spotify/callback?code={code}
Exchange Spotify authorization code for app token.

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_uuid",
    "spotify_id": "spotify_user_id",
    "display_name": "User Name",
    "email": "user@example.com"
  }
}
```

#### POST /auth/refresh
Refresh JWT token.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "token": "new_jwt_token"
}
```

### User Endpoints

#### GET /api/users/me
Get current user profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "spotify_id": "spotify_id",
  "display_name": "Name",
  "email": "email@example.com",
  "bio": "Bio text",
  "profile_photo_url": "https://...",
  "top_artists": [...],
  "top_genres": [...],
  "top_tracks": [...]
}
```

#### PUT /api/users/me
Update user profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "display_name": "New Name",
  "bio": "New bio",
  "profile_photo_url": "https://..."
}
```

#### POST /api/users/me/location
Update user location.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

#### GET /api/users/me/music-taste
Get user's music taste data.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "top_artists": [...],
  "top_genres": [...],
  "top_tracks": [...],
  "last_spotify_sync": "2026-01-07T12:00:00Z"
}
```

#### POST /api/users/me/sync-spotify
Manually trigger Spotify data sync.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Spotify data synced successfully"
}
```

### Match Endpoints

#### GET /api/matches/today
Get today's match.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "match_uuid",
  "match_score": 0.85,
  "music_similarity": 0.82,
  "distance_km": 5.2,
  "identities_revealed": false,
  "reveal_requested": false,
  "other_user": {
    "id": "user_id",
    "display_name": null,
    "profile_photo_url": null
  },
  "shared_artists": [...],
  "shared_genres": [...]
}
```

#### GET /api/matches/history?limit=30
Get match history.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional): Number of matches to return (default: 30)

**Response:**
```json
[
  {
    "id": "match_uuid",
    "created_at": "2026-01-07",
    "music_similarity": 0.82,
    "identities_revealed": false,
    "other_user": {
      "id": "user_id",
      "display_name": null
    }
  }
]
```

#### POST /api/matches/:matchId/report
Report a match/user.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "reason": "spam" | "harassment" | "fake" | "other"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /api/matches/:matchId/block
Block a user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true
}
```

### Chat Endpoints

#### GET /api/chat/:matchId/messages
Get message history for a match.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "message_uuid",
    "match_id": "match_uuid",
    "sender_id": "user_uuid",
    "content": "Hello!",
    "is_read": false,
    "created_at": "2026-01-07T12:00:00Z"
  }
]
```

#### POST /api/chat/:matchId/messages
Send a message.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "content": "Message text"
}
```

**Response:**
```json
{
  "id": "message_uuid",
  "match_id": "match_uuid",
  "sender_id": "user_uuid",
  "content": "Message text",
  "is_read": false,
  "created_at": "2026-01-07T12:00:00Z"
}
```

#### POST /api/chat/:matchId/reveal-request
Request identity reveal.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Reveal request sent"
}
```

#### POST /api/chat/:matchId/reveal-accept
Accept identity reveal request.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Identities revealed"
}
```

## Database Schema

### Tables

- **users**: User profiles with music embeddings (17-dimensional vector)
- **spotify_tokens**: Spotify access/refresh tokens
- **matches**: Daily matches between users
- **messages**: Chat messages
- **reports**: User reports
- **blocks**: Blocked users

See `src/config/database.sql` for complete schema with indexes and functions.

## Architecture

### Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── supabase.ts      # Supabase client configuration
│   │   ├── logger.ts        # Winston logger setup
│   │   └── database.sql     # Database schema
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── matchController.ts
│   │   └── chatController.ts
│   ├── services/
│   │   ├── spotifyService.ts    # Spotify API integration
│   │   └── embeddingService.ts  # Music embedding generation
│   ├── middleware/
│   │   └── auth.ts              # JWT authentication
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── matchRoutes.ts
│   │   └── chatRoutes.ts
│   ├── jobs/
│   │   └── dailyMatching.ts     # Daily matching cron job
│   └── index.ts                 # Entry point
├── package.json
└── tsconfig.json
```

### Key Components

**Spotify Service**
- Handles OAuth flow
- Fetches user's top tracks, artists, and audio features
- Manages token refresh

**Embedding Service**
- Generates 17-dimensional music embedding vector
- Calculates cosine similarity between users
- Combines audio features and genre vectors

**Daily Matching Job**
- Runs at 12:00 AM IST (6:30 PM UTC)
- Finds best matches using vector similarity and location
- Creates one match per user per day

**Authentication**
- JWT-based authentication
- Spotify OAuth integration
- Token refresh mechanism

## Logging

The backend uses Winston for structured logging:

- Console output (colorized in development)
- File logs: `logs/error.log` (errors only)
- File logs: `logs/combined.log` (all logs)

Log levels: `error`, `warn`, `info`, `debug`

## Development

### Scripts

- `npm run dev`: Start development server with nodemon
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run production build

### Code Style

- TypeScript strict mode enabled
- ESLint recommended
- Consistent error handling
- Structured logging

## Testing

### Manual Testing

1. Test Spotify OAuth flow
2. Verify user profile creation
3. Test location updates
4. Test Spotify data sync
5. Test daily matching (or trigger manually)
6. Test real-time chat
7. Test identity reveal flow

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```
