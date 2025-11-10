import React from 'react';

import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ui/ToastProvider';
import './styles/app.css';
import 'tippy.js/dist/tippy.css';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker registrado!'))
    .catch((err) => console.error('Erro ao registrar SW:', err));
}
