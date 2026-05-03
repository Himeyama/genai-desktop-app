import { App } from './App.tsx';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router';
import { OnlineStatusProvider } from '@/components/OnlineStatusProvider';
import { GlobalErrorFallback } from '@/components/ui/GlobalErrorFallback';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OnlineStatusProvider>
      <BrowserRouter>
        <ErrorBoundary
          fallbackRender={GlobalErrorFallback}
          onReset={() => window.location.reload()}
        >
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </OnlineStatusProvider>
  </React.StrictMode>,
);
