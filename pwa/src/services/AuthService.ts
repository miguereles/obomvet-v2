import api from './api';
// 1. Removida a extensão '.ts' dos imports
import { LoginResponse, RegisterResponse, AuthResponse } from './types'; 
import { 
    setTokenFallback, 
    setUserFallback, 
    clearTokenFallback
    // 2. Removido 'setClinicaIdFallback' pois não existe em 'auth.ts'
} from '../utils/auth';
import { setBroadcastToken } from './echo';

// 3. Helper 'saveAuthData' corrigido
const saveAuthData = (data: LoginResponse) => {
    if (data.access_token) {
        setTokenFallback(data.access_token);

        // 4. A função 'setUserFallback' recebe o 'data' diretamente.
        // Ela já sabe como lidar com 'clinica_id', 'tutor_id', etc.
        setUserFallback(data);
        
        // 5. Os blocos 'if (data.user)' e 'if (data.user?.tipo...)'
        // foram removidos pois estavam incorretos e são desnecessários.

        try {
            setBroadcastToken(data.access_token);
        } catch (e) {
            console.warn('setBroadcastToken falhou.', e);
        }
    }
};


const AuthService = {
  
    /**
     * Realiza login e salva o token/usuário no localStorage.
     * Rota: POST /auth/login
     */
    login: async (credentials: { email: string, password: string }): Promise<LoginResponse> => {
        const { data } = await api.post<LoginResponse>('/auth/login', credentials);
        saveAuthData(data); // Salva os dados
        return data;
    },

    /**
     * Registra um novo usuário (Tutor, Clínica ou Vet).
     * Rota: POST /auth/register
     */
    register: async (payload: any): Promise<RegisterResponse> => {
        const { data } = await api.post<RegisterResponse>('/auth/register', payload);
        // Não loga automaticamente, apenas retorna os dados
        return data;
    },
  
    /**
     * Realiza logout, invalidando o token no backend e limpando localmente.
     * Rota: POST /auth/logout
     */
    logout: async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Erro ao deslogar da API, limpando localmente.", error);
        } finally {
            clearTokenFallback();
            try {
                setBroadcastToken(null);
            } catch (e) {
                console.warn('setBroadcastToken(null) falhou.', e);
            }
            // Garante o redirecionamento
            if (window.location.pathname !== '/login') {
                 window.location.href = '/login';
            }
        }
    },

    /**
     * Renova o token de acesso usando a rota /auth/refresh.
     * Rota: POST /auth/refresh
     */
    refreshToken: async (): Promise<string | null> => {
        console.log("Tentando renovar o token...");
        try {
            // A rota /auth/refresh retorna a mesma estrutura de /auth/login
            const { data } = await api.post<LoginResponse>('/auth/refresh');
            
            if (data.access_token) {
                saveAuthData(data); // Salva o novo token e dados
                console.log("Token renovado com sucesso.");
                return data.access_token;
            }
            return null;
        } catch (error) {
            console.error("Não foi possível renovar o token (sessão expirada):", error);
            // Se o refresh falhar (ex: token expirado há > 1 ano), desloga o usuário
            await AuthService.logout(); 
            return null;
        }
    }
};

export default AuthService;