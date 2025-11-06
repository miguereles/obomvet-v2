import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getToken } from '../utils/auth'; // Importa seu helper de token [cite: src/utils/auth.ts]

// Torna o Pusher globalmente disponível para o Echo
(window as any).Pusher = Pusher;

// Lendo as variáveis de produção do Pusher (do seu ficheiro .env do frontend)
const VITE_API_URL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000';
const VITE_PUSHER_APP_KEY = (import.meta as any).env.VITE_PUSHER_APP_KEY;
const VITE_PUSHER_APP_CLUSTER = (import.meta as any).env.VITE_PUSHER_APP_CLUSTER;

const token = getToken();

const options = {
  broadcaster: 'pusher',
  key: VITE_PUSHER_APP_KEY,       // "3ef3d620c4f4ef9f57f3"
  cluster: VITE_PUSHER_APP_CLUSTER, // "sa1"
  forceTLS: true,                   // O Pusher na nuvem USA HTTPS/WSS
  
  // As configurações 'wsHost' e 'wsPort' foram REMOVIDAS
  // porque estamos a usar o serviço de nuvem, não um servidor local.

  // Endpoint de autenticação (ainda é o seu backend)
  authEndpoint: `${VITE_API_URL}/api/broadcasting/auth`, // [cite: routes/api.php]
  
  // Envia o token JWT para autorizar a escuta em canais privados
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  },
};

// Cria e exporta a instância real do Echo
export const echo = new Echo(options);

// Para debug: logar o estado da conexão
echo.connector.pusher.connection.bind('state_change', (states: any) => {
  console.log('[Echo] Mudança de estado da conexão:', states.current);
});

export default echo;