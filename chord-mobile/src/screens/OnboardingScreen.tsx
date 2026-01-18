import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSpotifyAuth, exchangeSpotifyCode } from '../services/spotifyAuth';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation, updateUserLocation } from '../services/locationService';
import * as Linking from 'expo-linking';

export default function OnboardingScreen() {
  const { request, response, promptAsync } = useSpotifyAuth();
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (response?.type === 'success' && response.params?.code) {
      handleSpotifyCallback(response.params.code);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Spotify authorization failed');
      setLoading(false);
    }
  }, [response]);

  const handleSpotifyCallback = async (code: string) => {
    try {
      setLoading(true);

      // Exchange code for token via backend
      const authData = await exchangeSpotifyCode(code);

      // Set auth context
      await setAuth(authData.token, authData.user);

      // Request location permission and update
      const location = await getCurrentLocation();
      if (location) {
        await updateUserLocation(location.latitude, location.longitude);
      } else {
        Alert.alert(
          'Location',
          'Location permission is required to find matches nearby. You can enable it later in settings.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSpotify = async () => {
    try {
      setLoading(true);
      await promptAsync();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open Spotify');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎵 Chord</Text>
        <Text style={styles.subtitle}>
          Connect with people who share your music taste
        </Text>
        <Text style={styles.description}>
          We use your Spotify listening history to find meaningful connections
          based on authentic music preferences.
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConnectSpotify}
          disabled={loading || !request}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Connect with Spotify</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          We only store aggregated music data (top artists, genres). No
          timestamped listening history is saved.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    opacity: 0.9,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  privacyNote: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 18,
  },
});

