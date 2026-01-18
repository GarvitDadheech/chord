import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  getMessages,
  sendMessage,
  subscribeToChatMessages,
  Message,
  requestReveal,
  acceptReveal,
} from '../services/chatService';
import { getTodayMatch, Match } from '../services/matchService';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const matchId = (route.params as any)?.matchId;
  
  const [messages, setMessages] = useState([] as Message[]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null as Match | null);
  const flatListRef = useRef(null as FlatList | null);

  useEffect(() => {
    if (matchId) {
      loadMatch();
      loadMessages();
      const unsubscribe = subscribeToChatMessages(matchId, (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
      });

      return () => unsubscribe();
    }
  }, [matchId]);

  const loadMatch = async () => {
    try {
      const todayMatch = await getTodayMatch();
      if (todayMatch && todayMatch.id === matchId) {
        setMatch(todayMatch);
      }
    } catch (error) {
      console.error('Error loading match:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messageList = await getMessages(matchId);
      setMessages(messageList);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      const newMessage = await sendMessage(matchId, inputText);
      setMessages((prev) => [...prev, newMessage]);
      setInputText('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleRequestReveal = async () => {
    try {
      await requestReveal(matchId);
      await loadMatch(); // Refresh match data
    } catch (error) {
      console.error('Error requesting reveal:', error);
    }
  };

  const handleAcceptReveal = async () => {
    try {
      await acceptReveal(matchId);
      await loadMatch(); // Refresh match data
    } catch (error) {
      console.error('Error accepting reveal:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender_id === user?.id;
    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={isOwn ? styles.ownMessageText : styles.otherMessageText}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {match && (
        <View style={styles.matchBanner}>
          <Text style={styles.matchBannerText}>
            🎵 {Math.round(match.music_similarity * 100)}% Music Match
          </Text>
          {!match.identities_revealed && (
            <View style={styles.revealSection}>
              {match.reveal_requested ? (
                <TouchableOpacity
                  style={styles.revealButton}
                  onPress={handleAcceptReveal}
                >
                  <Text style={styles.revealButtonText}>Accept Reveal</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.revealButton}
                  onPress={handleRequestReveal}
                >
                  <Text style={styles.revealButtonText}>Request Reveal</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        onContentSizeChange={scrollToBottom}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  matchBanner: {
    backgroundColor: '#1DB954',
    padding: 16,
    alignItems: 'center',
  },
  matchBannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  revealSection: {
    marginTop: 8,
  },
  revealButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  revealButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1DB954',
  },
  ownMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  otherMessageText: {
    color: '#000',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

