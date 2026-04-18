import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import '@/styles/base.css';
import '@/styles/layout.css';
import '@/styles/pages.css';
import '@/styles/components.css';
import '@/styles/legal.css';
import '@/styles/onboarding.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
