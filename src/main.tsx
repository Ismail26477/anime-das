// src/main.tsx (or index.tsx) — top of file
import 'react-toastify/dist/ReactToastify.css';
import './index.css';  // or your Tailwind / app CSS

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
