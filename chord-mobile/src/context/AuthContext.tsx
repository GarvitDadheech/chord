import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import { getCurrentUser, User } from '../services/userService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  setAuth: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
} as AuthContextType);

export const AuthProvider = ({
  children,
}: {
  children: any;
}) => {
  const [user, setUser] = useState(null as User | null);
  const [token, setToken] = useState(null as string | null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (storedToken) {
        setToken(storedToken);
        // Try to fetch user profile
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Token might be invalid, clear it
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setAuth = async (newToken: string, userData: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userData.id);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Error setting auth:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        setAuth,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

