import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const isLocalDev = (import.meta.env.VITE_STAGE || 'localdev') === 'localdev';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token on each request
apiClient.interceptors.request.use(async (config) => {
  const store = useAuthStore.getState();

  // For Cognito, refresh token before each request (Amplify caches it)
  if (!isLocalDev && store.isAuthenticated) {
    await store.refreshToken();
  }

  const { user } = useAuthStore.getState();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
