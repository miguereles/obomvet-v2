import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
// ✅ CORRIGIDO: O nome da função é 'getToken', não 'getTokenFallback'
import { getToken } from '../utils/auth'; // Importa seu helper de token [cite: src/utils/auth.ts]

// Torna o Pusher globalmente disponível para o Echo
(window as any).Pusher = Pusher;

// Lendo as variáveis de produção do Pusher (do seu ficheiro .env do frontend)
const VITE_API_URL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000';
const VITE_PUSHER_APP_KEY = (import.meta as any).env.VITE_PUSHER_APP_KEY;
const VITE_PUSHER_APP_CLUSTER = (import.meta as any).env.VITE_PUSHER_APP_CLUSTER;

// Cria opções do Echo com um authorizer dinâmico (lê o token na hora da requisição)
const options = {
  broadcaster: 'pusher',
  key: VITE_PUSHER_APP_KEY,
  cluster: VITE_PUSHER_APP_CLUSTER,
  forceTLS: true,
  authEndpoint: `${VITE_API_URL}/api/broadcasting/auth`,
  // Remove the nested 'auth' object and use a custom authorizer directly
  // This ensures our custom authorizer is used instead of Pusher's default
  authorizer: (channel: any, options: any) => {
    return {
      authorize: (socketId: string, callback: (err: any, auth?: any) => void) => {
        const token = (typeof broadcastToken !== 'undefined' && broadcastToken) ? broadcastToken : getToken();
        // Include token in the body as a safe fallback in case an intermediary
        // strips the Authorization header. The backend middleware already
        // accepts 'token' from the request body as a development-time fallback.
        const body = JSON.stringify({ socket_id: socketId, channel_name: channel.name, token });

        // Debug logging to help trace silent failures
        console.log('[Echo] authorizing', {
          socketId,
          channel: channel.name,
          authEndpoint: options.authEndpoint,
          tokenPresent: !!token,
        });

        const headers = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // Log the exact headers object that will be sent to the auth endpoint
        console.log('[Echo] authorizer headers', headers);

        // If there's no token, fail fast with a clear message to help debugging
        if (!token) {
          console.warn('[Echo] No token available for broadcasting auth');
          return callback(new Error('No token available for broadcasting auth'));
        }

        fetch(options.authEndpoint, {
          method: 'POST',
          headers,
          body,
        })
          .then(async (res) => {
            const text = await res.text();
            console.log('[Echo] authorizer response', { status: res.status, body: text });

            if (!res.ok) {
              return callback(new Error(`Auth error ${res.status}: ${text}`));
            }

            try {
              const data = JSON.parse(text);
              return callback(null, data);
            } catch (e) {
              return callback(new Error('Invalid JSON in auth response'));
            }
          })
          .catch((err) => {
            console.error('[Echo] authorizer fetch failed', err);
            callback(err);
          });
      },
    };
  },
};

// Module-level broadcast token (can be set by AuthService after login)
let broadcastToken: string | null = null;

export function setBroadcastToken(token: string | null) {
  broadcastToken = token;
  console.log('[Echo] broadcastToken set:', !!token);
}

// Cria e exporta a instância real do Echo
export const echo = new Echo(options as any);

// Para debug: logar o estado da conexão (acesso defensivo para manter tipagem TS)
(echo as any).connector?.pusher?.connection?.bind?.('state_change', (states: any) => {
  console.log('[Echo] Mudança de estado da conexão:', states.current);
});