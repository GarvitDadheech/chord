# Quick Start Guide - Chord

This guide will help you get Chord up and running in 15 minutes.

## ⚡ Prerequisites Check

- [ ] Node.js installed (v18+)
- [ ] npm or yarn installed
- [ ] Expo CLI installed: `npm install -g expo-cli`
- [ ] Spotify Developer account
- [ ] Supabase account

## 🚀 5-Minute Setup

### 1. Spotify Setup (2 minutes)

1. Go to https://developer.spotify.com/dashboard
2. Create new app → Name: "Chord"
3. Add Redirect URI: `http://localhost:3000/auth/spotify/callback`
4. Copy **Client ID** and **Client Secret**

### 2. Supabase Setup (2 minutes)

1. Go to https://supabase.com
2. Create new project
3. Go to SQL Editor
4. Copy and paste entire content from `server/src/config/database.sql`
5. Run the SQL
6. Copy **Project URL**, **Anon Key**, and **Service Role Key**

### 3. Backend Setup (1 minute)

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
JWT_SECRET=your-random-secret-key-here
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Start backend:
```bash
npm run dev
```

### 4. Frontend Setup (1 minute)

```bash
cd chord-mobile
npm install
```

Edit `src/config/constants.ts`:
```typescript
export const API_BASE_URL = 'http://YOUR_LOCAL_IP:3000'; // Use your computer's IP, not localhost
export const SPOTIFY_CLIENT_ID = 'your-client-id';
export const SUPABASE_URL = 'your-supabase-url';
export const SUPABASE_ANON_KEY = 'your-anon-key';
```

**Important**: For mobile testing, use your computer's local IP address instead of `localhost`. Find it with:
- **Mac/Linux**: `ifconfig | grep "inet "`
- **Windows**: `ipconfig`

Start Expo:
```bash
npm start
```

## 📱 Testing the App

### Test Flow

1. **Open app** → Should show onboarding screen
2. **Tap "Connect with Spotify"** → Opens Spotify login
3. **Login with Spotify** → Redirects back to app
4. **Grant location permission** → Location updated
5. **Wait for Spotify sync** → Music data fetched
6. **See home screen** → Profile created

### Testing Matching

To test matching without waiting for cron:

1. Create 2 test users with different Spotify accounts
2. Ensure both have:
   - Music embeddings (check profile → sync Spotify)
   - Location set
3. Manually run matching or wait for 12:00 AM IST

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to backend"

**Fix**: 
- Check backend is running on port 3000
- Use your computer's IP address, not `localhost`
- Ensure phone and computer are on same WiFi network

### Issue: "Spotify OAuth failed"

**Fix**:
- Check redirect URI matches exactly in Spotify dashboard
- Verify Client ID is correct
- Check scopes are granted

### Issue: "Database error"

**Fix**:
- Verify Supabase credentials in `.env`
- Check database schema is created (run SQL)
- Ensure extensions (vector, postgis) are enabled

### Issue: "Location permission denied"

**Fix**:
- Check `app.json` has location permissions
- Test on physical device (emulator may have issues)
- Grant permission in device settings

## 📝 Next Steps

1. ✅ Test complete user flow
2. ✅ Test chat functionality
3. ✅ Test identity reveal
4. ✅ Record demo video
5. ✅ Prepare for submission

## 🎥 Demo Video Checklist

Your demo video should show:

- [ ] App launch and onboarding
- [ ] Spotify OAuth flow
- [ ] Location permission
- [ ] Profile creation
- [ ] Music taste display
- [ ] Daily match (or explain matching system)
- [ ] Chat functionality
- [ ] Identity reveal
- [ ] Backend API calls (show in Postman or logs)
- [ ] Database operations (show in Supabase dashboard)

## 📞 Need Help?

- Check `README.md` for detailed documentation
- Check `SPOTIFY_API_GUIDE.md` for Spotify-specific help
- Review error messages in terminal/console
- Check Supabase logs for database errors

---

**Good luck with your submission! 🎵**

