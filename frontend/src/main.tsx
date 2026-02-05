import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { NetworkManager } from './lib/sync/NetworkManager'

// Initialize network manager
const networkManager = NetworkManager.getInstance();

// Network status listener
networkManager.onStatusChange(() => {
  // Silent network status changes
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Listen for SW messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_TRIGGER') {
          // Trigger sync when SW requests it
          window.dispatchEvent(new CustomEvent('online-sync-trigger'));
        }
      });

      // Register background sync if supported
      if ('sync' in registration) {
        // Background sync will be triggered automatically when online
      }
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
