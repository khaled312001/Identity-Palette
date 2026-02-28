import { Platform } from 'react-native';

export function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin && !origin.includes('localhost:8081') && !origin.includes('localhost:8082')) {
      return origin;
    }
  }

  if (process.env.EXPO_PUBLIC_DOMAIN) {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${domain}`;
  }

  if (Platform.OS === 'web') {
    return "http://localhost:5000";
  }

  return "http://localhost:5000";
}
