import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { getTodayMatch, Match } from '../services/matchService';
import type { RootStackParamList } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation() as unknown as StackNavigationProp<RootStackParamList>;
  const { user, logout } = useAuth();
  const [match, setMatch] = useState(null as Match | null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayMatch();
  }, []);

  const loadTodayMatch = async () => {
    try {
      setLoading(true);
      const todayMatch = await getTodayMatch();
      setMatch(todayMatch);
    } catch (error) {
      console.error('Error loading match:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {user?.display_name || 'Music Lover'}! 🎵
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileLink}>Profile</Text>
        </TouchableOpacity>
      </View>

      {match ? (
        <View style={styles.matchCard}>
          <Text style={styles.matchTitle}>Your Match Today</Text>
          <Text style={styles.matchPercentage}>
            {Math.round(match.music_similarity * 100)}% Music Match
          </Text>

          {match.shared_artists.length > 0 && (
            <View style={styles.sharedSection}>
              <Text style={styles.sharedTitle}>You both love:</Text>
              <Text style={styles.sharedItems}>
                {match.shared_artists.map((a) => a.name).join(', ')}
              </Text>
            </View>
          )}

          {match.shared_genres.length > 0 && (
            <View style={styles.sharedSection}>
              <Text style={styles.sharedTitle}>Top genres:</Text>
              <Text style={styles.sharedItems}>
                {match.shared_genres.map((g) => g.name).join(', ')}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', { matchId: match.id })}
          >
            <Text style={styles.chatButtonText}>Start Chatting</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noMatchCard}>
          <Text style={styles.noMatchText}>
            No match yet today. Check back tomorrow! 🎵
          </Text>
          <Text style={styles.noMatchSubtext}>
            We'll find you someone with similar music taste nearby.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  profileLink: {
    fontSize: 16,
    color: '#1DB954',
    fontWeight: '600',
  },
  matchCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  matchPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 16,
  },
  sharedSection: {
    marginBottom: 12,
  },
  sharedTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sharedItems: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  chatButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noMatchCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  noMatchText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  noMatchSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  logoutButton: {
    margin: 20,
    padding: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#666',
    fontSize: 16,
  },
});

