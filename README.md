# Chord

A social discovery application that connects users based on authentic music taste rather than superficial profiles. By analyzing Spotify listening behavior and combining it with proximity-based matching, Chord creates meaningful connections between people who share genuine musical interests.

## Overview

Chord uses behavioral data from Spotify to find compatible matches within a user's geographic area. Users communicate anonymously until both parties opt to reveal their identities, reducing pressure and encouraging authentic conversations.

### Key Features

- Spotify Integration: Authentic music taste analysis using Spotify listening data
- Location-Based Matching: Find matches within 50km radius
- Anonymous Chat: Chat anonymously until both parties opt to reveal identities
- Daily Matching: One quality match per day
- Privacy-First: Only aggregated music data stored (no timestamped history)

## Tech Stack

### Backend
- Node.js with TypeScript
- Express.js
- Supabase (PostgreSQL with pgvector extension)
- JWT + Spotify OAuth
- node-cron (daily matching)

### Frontend
- React Native (Expo)
- React Navigation
- React Context API
- Supabase Realtime (WebSockets)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Spotify Developer Account
- Supabase Account

## Quick Start

### 1. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add Redirect URI: `http://localhost:3000/auth/spotify/callback` and `chord://spotify-auth`
4. Save your Client ID and Client Secret
5. Required scopes: `user-top-read`, `user-read-recently-played`, `user-read-private`, `user-read-email`

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `server/src/config/database.sql`
3. Enable required extensions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "vector";
   CREATE EXTENSION IF NOT EXISTS "postgis";
   ```
4. Copy your Project URL and API Keys

### 3. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

The backend will run on `http://localhost:3000`

### 4. Frontend Setup

```bash
cd chord-mobile
npm install
# Update src/config/constants.ts with your credentials
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
1. Install Expo Go app
2. Scan QR code from terminal
3. Ensure phone and computer are on the same network

## Environment Variables

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
export const API_BASE_URL = 'http://your-local-ip:3000';
export const SPOTIFY_CLIENT_ID = 'your-client-id';
export const SUPABASE_URL = 'your-supabase-url';
export const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Database Schema

- users: User profiles with music embeddings
- spotify_tokens: Spotify access/refresh tokens
- matches: Daily matches between users
- messages: Chat messages
- reports: User reports
- blocks: Blocked users

See `server/src/config/database.sql` for complete schema.

## Features Implemented

- Spotify OAuth integration
- Music embedding generation (17-dimensional vector)
- Location-based proximity filtering
- Daily matchmaking algorithm
- Anonymous real-time chat
- Mutual identity reveal mechanism
- Basic safety controls (report, block)
- User profile management
- Spotify data sync

## Project Structure

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

## Documentation

For detailed API documentation and backend information, see [server/README.md](server/README.md).
