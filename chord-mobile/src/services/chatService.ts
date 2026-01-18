import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/constants';
import api from './api';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Subscribe to chat messages for a match
 */
export const subscribeToChatMessages = (
  matchId: string,
  callback: (message: Message) => void
): (() => void) => {
  const channel: RealtimeChannel = supabase
    .channel(`chat:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Get message history for a match
 */
export const getMessages = async (matchId: string): Promise<Message[]> => {
  try {
    const response = await api.get(`/api/chat/${matchId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Send a message
 */
export const sendMessage = async (
  matchId: string,
  content: string
): Promise<Message> => {
  try {
    const response = await api.post(`/api/chat/${matchId}/messages`, {
      content,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Request identity reveal
 */
export const requestReveal = async (matchId: string): Promise<boolean> => {
  try {
    const response = await api.post(`/api/chat/${matchId}/reveal-request`);
    return response.status === 200;
  } catch (error) {
    console.error('Error requesting reveal:', error);
    throw error;
  }
};

/**
 * Accept identity reveal
 */
export const acceptReveal = async (matchId: string): Promise<boolean> => {
  try {
    const response = await api.post(`/api/chat/${matchId}/reveal-accept`);
    return response.status === 200;
  } catch (error) {
    console.error('Error accepting reveal:', error);
    throw error;
  }
};

