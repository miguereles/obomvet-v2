import api from './api';
import { LoginResponse, RegisterResponse } from './types';
// Importamos suas funções utilitárias para salvar no localStorage
import { setTokenFallback, setUserFallback, clearTokenFallback } from '../utils/auth';
import { setBroadcastToken } from './echo';

const AuthService = {
  
  /**
   * Realiza login e salva o token/usuário no localStorage.
   * Rota: POST /auth/login (definida em routes/api.php)
   */
  login: async (credentials: { email: string, password: string }): Promise<LoginResponse> => {
    
    // O 'api.post' já usa a baseURL (http://.../api)
  // Make the login request
  const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Se o login for bem-sucedido, salvamos os dados
      if (data.access_token) {
      // Usamos as mesmas funções que seu login.tsx usava
      setTokenFallback(data.access_token);
      setUserFallback(data);
      // Also update the broadcast token used by the Echo authorizer so private
      // channel auth uses the freshest token without waiting for a page reload.
      try {
        setBroadcastToken(data.access_token);
      } catch (e) {
        // noop in non-browser/test environments
      }
    }
    return data;
  },

  /**
   * Registra um novo usuário (Tutor, Clínica ou Vet).
   * Rota: POST /auth/register (definida em routes/api.php)
   */
  register: async (payload: any): Promise<RegisterResponse> => {
    // O payload é o objeto complexo que seu register.tsx monta
    const { data } = await api.post<RegisterResponse>('/auth/register', payload);
    return data;
  },
  
  /**
   * Realiza logout
   * Rota: POST /auth/logout (definida em routes/api.php)
   */
  logout: async (): Promise<void> => {
    try {
        // Tenta invalidar o token no backend
        await api.post('/auth/logout');
    } catch (error) {
        console.error("Erro ao deslogar da API (token pode já ter expirado), limpando localmente.", error);
    } finally {
        // Limpa o storage local de qualquer maneira
        clearTokenFallback(); // do seu utils/auth.ts
        try {
          setBroadcastToken(null);
        } catch (e) {}
    }
  },

  /**
   * Busca os dados do usuário logado.
   * Rota: GET /auth/me (definida em routes/api.php, mas seu dashboard usa /usuarios/:id)
   * Vamos manter a rota do dashboard por enquanto.
   */
  // getMe: async (): Promise<Usuario> => {
  //   const { data } = await api.get('/auth/me');
  //   return data;
  // }
};

export default AuthService;