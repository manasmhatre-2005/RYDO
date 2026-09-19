import axios from 'axios';

// Resolve API base URL: Render or local development
const normalizeUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

const rawBaseUrl = normalizeUrl(import.meta.env.VITE_API_URL || '');
export const API_BASE_URL = rawBaseUrl.endsWith('/')
  ? `${rawBaseUrl}api/v1`
  : rawBaseUrl
    ? `${rawBaseUrl}/api/v1`
    : '/api/v1';

export const WS_BASE_URL = (() => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (rawBaseUrl) {
    const wsProto = rawBaseUrl.startsWith('https') ? 'wss://' : 'ws://';
    return rawBaseUrl.replace(/^https?:\/\//, wsProto);
  }
  const loc = window.location;
  const wsProto = loc.protocol === 'https:' ? 'wss://' : 'ws://';
  return `${wsProto}${loc.hostname}:8000`;
})();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rydo_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking auth or on login page
      if (!window.location.pathname.includes('/login')) {
        // Optional session expiration handling
      }
    }
    return Promise.reject(error);
  }
);
