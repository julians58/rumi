import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from './lib/query-client';
import { useAuthStore } from './store/auth.store';
import { configureCognito } from './lib/cognito';
import App from './App';
import './index.css';

// Configure Cognito (no-op in localdev when env vars are missing)
configureCognito();

// Rehydrate auth state from localStorage before render
useAuthStore.getState().initFromStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
