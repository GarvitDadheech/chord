import * as Location from 'expo-location';

/**
 * Request foreground location permission
 */
export const requestForegroundPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current location
 */
export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  try {
    const hasPermission = await requestForegroundPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Update user location on backend
 */
export const updateUserLocation = async (
  latitude: number,
  longitude: number
): Promise<boolean> => {
  try {
    const api = require('./api').default;
    const response = await api.post('/api/users/me/location', {
      latitude,
      longitude,
    });

    return response.status === 200;
  } catch (error) {
    console.error('Error updating location:', error);
    return false;
  }
};

