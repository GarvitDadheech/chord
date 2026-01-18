import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { updateProfile, syncSpotify, getMusicTaste } from '../services/userService';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [syncing, setSyncing] = useState(false);
  const [musicTaste, setMusicTaste] = useState(null as {
    top_artists: Array<{ name: string; spotify_id: string; image: string | null; genres: string[] }>;
    top_genres: Array<{ name: string; weight: number }>;
    top_tracks: Array<{ name: string; artist: string; spotify_id: string }>;
    last_spotify_sync: string | null;
  } | null);

  useEffect(() => {
    loadMusicTaste();
  }, []);

  const loadMusicTaste = async () => {
    try {
      const taste = await getMusicTaste();
      setMusicTaste(taste);
    } catch (error) {
      console.error('Error loading music taste:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        display_name: displayName,
        bio: bio.length > 50 ? bio.substring(0, 50) : bio,
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleSyncSpotify = async () => {
    try {
      setSyncing(true);
      await syncSpotify();
      await refreshUser();
      await loadMusicTaste();
      Alert.alert('Success', 'Spotify data synced');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sync Spotify');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your display name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio (max 50 characters)</Text>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            maxLength={50}
            multiline
          />
          <Text style={styles.charCount}>{bio.length}/50</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Music Taste</Text>
        
        {musicTaste && (
          <>
            {musicTaste.top_artists && musicTaste.top_artists.length > 0 && (
              <View style={styles.musicSection}>
                <Text style={styles.musicTitle}>Top Artists</Text>
                {musicTaste.top_artists.slice(0, 5).map((artist: any, idx: number) => (
                  <Text key={idx} style={styles.musicItem}>
                    {idx + 1}. {artist.name}
                  </Text>
                ))}
              </View>
            )}

            {musicTaste.top_genres && musicTaste.top_genres.length > 0 && (
              <View style={styles.musicSection}>
                <Text style={styles.musicTitle}>Top Genres</Text>
                {musicTaste.top_genres.map((genre: any, idx: number) => (
                  <Text key={idx} style={styles.musicItem}>
                    {genre.name}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={handleSyncSpotify}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.syncButtonText}>Sync Spotify Data</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  musicSection: {
    marginBottom: 20,
  },
  musicTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  musicItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  syncButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

