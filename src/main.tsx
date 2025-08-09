import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import './lib/i18n'; // Initialize i18n
import { criticalResources } from './lib/performance';

// Load critical resources
criticalResources.loadCriticalCSS();

// Defer non-critical resources
criticalResources.deferNonCriticalResources();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);