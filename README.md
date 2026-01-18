# Chord - Music-Based Social Discovery App

**Version:** v1.0 (MVP)  
**Roll No:** 23BCS10203

## 📱 Project Overview

Chord is a social discovery application that connects users based on authentic music taste rather than superficial profiles. By analyzing Spotify listening behavior and combining it with proximity-based matching, Chord creates meaningful connections between people who share genuine musical interests.

### Key Features

- 🎵 **Spotify Integration**: Authentic music taste analysis using Spotify listening data
- 📍 **Location-Based Matching**: Find matches within 50km radius
- 💬 **Anonymous Chat**: Chat anonymously until both parties opt to reveal identities
- 🎯 **Daily Matching**: One quality match per day
- 🔒 **Privacy-First**: Only aggregated music data stored (no timestamped history)

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Authentication**: JWT + Spotify OAuth
- **Job Scheduler**: node-cron (daily matching)

### Frontend
- **Framework**: React Native (Expo)
- **Navigation**: React Navigation
- **State Management**: React Context API
- **Real-time**: Supabase Realtime (WebSockets)

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo CLI**: `npm install -g expo-cli`
4. **Spotify Developer Account**: [Create one here](https://developer.spotify.com/dashboard)
5. **Supabase Account**: [Sign up here](https://supabase.com)

## 🚀 Setup Instructions

### 1. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create an App"
3. Fill in:
   - **App Name**: Chord
   - **App Description**: Music-based social discovery app
   - **Redirect URI**: 
     - Development: `http://localhost:3000/auth/spotify/callback`
     - Mobile: `chord://spotify-auth`
4. Save your **Client ID** and **Client Secret**
5. Note the required scopes:
   - `user-top-read`
   - `user-read-recently-played`
   - `user-read-private`
   - `user-read-email`

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `server/src/config/database.sql`
3. Enable required extensions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "vector";
   CREATE EXTENSION IF NOT EXISTS "postgis";
   ```
4. Copy your **Project URL** and **API Keys** (anon key and service role key)

### 3. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your credentials:
# - SPOTIFY_CLIENT_ID
# - SPOTIFY_CLIENT_SECRET
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - JWT_SECRET (generate a random string)

# Run database migrations
# Execute the SQL from server/src/config/database.sql in Supabase SQL Editor

# Start development server
npm run dev
```

The backend will run on `http://localhost:3000`

### 4. Frontend Setup

```bash
cd chord-mobile

# Install dependencies
npm install

# Update src/config/constants.ts with:
# - API_BASE_URL (your backend URL)
# - SPOTIFY_CLIENT_ID
# - SUPABASE_URL
# - SUPABASE_ANON_KEY

# Start Expo development server
npm start
```

### 5. Running on Device/Emulator

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Physical Device:**
1. Install Expo Go app from Play Store/App Store
2. Scan QR code from terminal
3. Make sure your phone and computer are on the same network

## 📡 API Documentation

### Authentication Endpoints

#### `GET /auth/spotify/authorize`
Get Spotify OAuth authorization URL.

**Response:**
```json
{
  "authUrl": "https://accounts.spotify.com/authorize?..."
}
```

#### `GET /auth/spotify/callback?code={code}`
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

#### `POST /auth/refresh`
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

#### `GET /api/users/me`
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

#### `PUT /api/users/me`
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

#### `POST /api/users/me/location`
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

#### `POST /api/users/me/sync-spotify`
Manually trigger Spotify data sync.

**Headers:**
```
Authorization: Bearer {token}
```

### Match Endpoints

#### `GET /api/matches/today`
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
  "other_user": {
    "id": "user_id",
    "display_name": null,
    "profile_photo_url": null
  },
  "shared_artists": [...],
  "shared_genres": [...]
}
```

#### `GET /api/matches/history?limit=30`
Get match history.

**Headers:**
```
Authorization: Bearer {token}
```

#### `POST /api/matches/:matchId/report`
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

#### `POST /api/matches/:matchId/block`
Block a user.

**Headers:**
```
Authorization: Bearer {token}
```

### Chat Endpoints

#### `GET /api/chat/:matchId/messages`
Get message history.

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

#### `POST /api/chat/:matchId/messages`
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

#### `POST /api/chat/:matchId/reveal-request`
Request identity reveal.

**Headers:**
```
Authorization: Bearer {token}
```

#### `POST /api/chat/:matchId/reveal-accept`
Accept identity reveal request.

**Headers:**
```
Authorization: Bearer {token}
```

## 🗄️ Database Schema

### Tables

- **users**: User profiles with music embeddings
- **spotify_tokens**: Encrypted Spotify access/refresh tokens
- **matches**: Daily matches between users
- **messages**: Chat messages
- **reports**: User reports
- **blocks**: Blocked users

See `server/src/config/database.sql` for complete schema.

## 🔐 Environment Variables

### Backend (.env)

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

### Frontend (src/config/constants.ts)

```typescript
export const API_BASE_URL = 'http://localhost:3000';
export const SPOTIFY_CLIENT_ID = 'your-client-id';
export const SUPABASE_URL = 'your-supabase-url';
export const SUPABASE_ANON_KEY = 'your-anon-key';
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Spotify OAuth flow works
- [ ] User profile creation/update
- [ ] Location permission and update
- [ ] Spotify data sync
- [ ] Daily matching algorithm (test manually or wait for cron)
- [ ] Chat messaging (real-time)
- [ ] Identity reveal flow
- [ ] Report/block functionality

### Testing Daily Matching

To test matching without waiting for cron:

1. Create two test users with different Spotify accounts
2. Ensure both have:
   - Music embeddings (sync Spotify data)
   - Location set
   - Active status
3. Manually trigger matching or wait for 12:00 AM IST

## 📱 Features Implemented

### ✅ Core Features (MVP)

- [x] Spotify OAuth integration
- [x] Music embedding generation (17-dimensional vector)
- [x] Location-based proximity filtering
- [x] Daily matchmaking algorithm
- [x] Anonymous real-time chat
- [x] Mutual identity reveal mechanism
- [x] Basic safety controls (report, block)
- [x] User profile management
- [x] Spotify data sync

### 🚧 Future Enhancements

- [ ] Group chat
- [ ] Concert/event integration
- [ ] Collaborative playlists
- [ ] Voice/video calling
- [ ] Advanced filters
- [ ] iOS version optimization

## 🐛 Troubleshooting

### Common Issues

**1. Spotify OAuth not working**
- Check redirect URI matches exactly in Spotify dashboard
- Ensure scopes are correctly set
- Verify Client ID and Secret are correct

**2. Database connection errors**
- Verify Supabase credentials in .env
- Check if extensions (vector, postgis) are enabled
- Ensure database schema is created

**3. Real-time chat not working**
- Check Supabase Realtime is enabled
- Verify Supabase anon key is correct
- Check network connectivity

**4. Location permission denied**
- Check app.json has location permissions
- Verify expo-location is installed
- Test on physical device (emulator may have issues)

## 📝 Project Structure

```
chord/
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── jobs/          # Cron jobs
│   │   └── index.ts       # Entry point
│   └── package.json
│
└── chord-mobile/          # Frontend (React Native)
    ├── src/
    │   ├── screens/       # App screens
    │   ├── components/    # Reusable components
    │   ├── navigation/    # Navigation setup
    │   ├── services/      # API services
    │   ├── context/       # React Context
    │   └── config/        # Configuration
    └── package.json
```

## 📄 License

This project is created for educational purposes as part of a college assignment.

## 👤 Author

**Garvit**  
Roll No: 23BCS10203

## 🙏 Acknowledgments

- Spotify Web API
- Supabase
- React Native & Expo
- All open-source contributors

---

**Note**: This is an MVP version. Production deployment would require additional security measures, error handling, and optimization.

