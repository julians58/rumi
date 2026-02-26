import { create } from 'zustand';
import { restoreCognitoSession, cognitoLogout, getCognitoToken } from '../services/cognito-auth.service';

const STAGE = import.meta.env.VITE_STAGE || 'localdev';
const isLocalDev = STAGE === 'localdev';

interface AuthUser {
  sub: string;
  userId: string;
  email: string;
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initFromStorage: () => void;
  /** Refresh the access token (Cognito only — local tokens don't expire). */
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('rumi_token', user.token);
      localStorage.setItem('rumi_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rumi_token');
      localStorage.removeItem('rumi_user');
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    localStorage.removeItem('rumi_token');
    localStorage.removeItem('rumi_user');
    set({ user: null, isAuthenticated: false });
    if (!isLocalDev) {
      cognitoLogout().catch(() => {});
    }
  },

  initFromStorage: () => {
    if (!isLocalDev) {
      // For Cognito stages, try to restore the session from Amplify
      restoreCognitoSession()
        .then((result) => {
          if (result) {
            const user: AuthUser = {
              sub: result.user.cognitoSub,
              userId: result.user.id,
              email: result.user.email,
              token: result.token,
            };
            localStorage.setItem('rumi_token', user.token);
            localStorage.setItem('rumi_user', JSON.stringify(user));
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            // No valid Cognito session — clear any stale local data
            localStorage.removeItem('rumi_token');
            localStorage.removeItem('rumi_user');
            set({ isLoading: false });
          }
        })
        .catch(() => {
          localStorage.removeItem('rumi_token');
          localStorage.removeItem('rumi_user');
          set({ isLoading: false });
        });
    } else {
      // LocalDev: restore from localStorage (tokens don't expire)
      const stored = localStorage.getItem('rumi_user');
      if (stored) {
        try {
          const user = JSON.parse(stored) as AuthUser;
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    }
  },

  refreshToken: async () => {
    if (isLocalDev) return; // Local tokens don't expire in dev

    const token = await getCognitoToken();
    if (token) {
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, token };
        localStorage.setItem('rumi_token', updated.token);
        localStorage.setItem('rumi_user', JSON.stringify(updated));
        set({ user: updated });
      }
    }
  },
}));
