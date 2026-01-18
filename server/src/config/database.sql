-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  email VARCHAR(255),
  profile_photo_url TEXT,
  bio VARCHAR(50),
  location GEOGRAPHY(POINT, 4326),
  last_location_update TIMESTAMP,
  music_embedding VECTOR(17), -- 7 audio features + 10 genre dimensions
  top_artists JSONB, -- [{name, spotify_id, image, genres}]
  top_genres JSONB, -- [{name, weight}]
  top_tracks JSONB, -- [{name, artist, spotify_id}]
  last_spotify_sync TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Spotify tokens (encrypted storage recommended in production)
CREATE TABLE IF NOT EXISTS spotify_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_score FLOAT NOT NULL,
  music_similarity FLOAT NOT NULL,
  distance_km FLOAT,
  created_at DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  identities_revealed BOOLEAN DEFAULT false,
  user1_revealed BOOLEAN DEFAULT false,
  user2_revealed BOOLEAN DEFAULT false,
  reveal_requested_by UUID REFERENCES users(id),
  reveal_requested_at TIMESTAMP,
  UNIQUE(user1_id, user2_id, created_at)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  reported_id UUID REFERENCES users(id),
  match_id UUID REFERENCES matches(id),
  reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID REFERENCES users(id),
  blocked_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_users_embedding ON users USING ivfflat (music_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);

-- Function to find match candidates using vector similarity
CREATE OR REPLACE FUNCTION find_match_candidates(
  p_user_id UUID,
  p_user_embedding VECTOR(17),
  p_user_location GEOGRAPHY,
  p_max_distance_km FLOAT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  music_similarity FLOAT,
  distance_km FLOAT,
  activity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    1 - (u.music_embedding <=> p_user_embedding) AS music_similarity,
    ST_Distance(u.location::geography, p_user_location) / 1000 AS distance_km,
    CASE 
      WHEN u.updated_at > NOW() - INTERVAL '7 days' THEN 1.0
      WHEN u.updated_at > NOW() - INTERVAL '14 days' THEN 0.7
      WHEN u.updated_at > NOW() - INTERVAL '30 days' THEN 0.4
      ELSE 0.1
    END AS activity_score
  FROM users u
  WHERE u.id != p_user_id
    AND u.is_active = true
    AND u.music_embedding IS NOT NULL
    AND u.location IS NOT NULL
    AND ST_DWithin(u.location::geography, p_user_location, p_max_distance_km * 1000)
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE ((m.user1_id = p_user_id AND m.user2_id = u.id)
         OR (m.user2_id = p_user_id AND m.user1_id = u.id))
      AND m.created_at > NOW() - INTERVAL '30 days'
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = p_user_id AND b.blocked_id = u.id)
         OR (b.blocker_id = u.id AND b.blocked_id = p_user_id)
    )
    AND (1 - (u.music_embedding <=> p_user_embedding)) > 0.60
  ORDER BY music_similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

