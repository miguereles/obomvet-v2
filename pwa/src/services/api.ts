import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
// Importa getToken para pegar o token atual diretamente
import { clearTokenFallback, setTokenFallback, getToken } from '../utils/auth';
import { setBroadcastToken } from './echo';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// Instância principal com interceptors
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Interceptor de REQUISIÇÃO
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- LÓGICA DE REFRESH TOKEN ---

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void, reject: (reason?: any) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        // Se não houver config, apenas rejeita
        if (!originalRequest) return Promise.reject(error);

        // 1. Evita loop infinito: Se a URL que falhou JÁ É a de refresh, não tenta de novo.
        if (originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        // 2. Se erro for 401 e ainda não tentamos retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                // Se já está renovando, põe na fila
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    // Atualiza o header da requisição na fila
                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    }
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                console.log("Interceptor: Token expirado. Tentando renovar...");
                
                const currentToken = getToken();

                // 3. USAR AXIOS PURO para o refresh para evitar loops
                const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                    headers: {
                        'Authorization': `Bearer ${currentToken}`,
                        'Accept': 'application/json'
                    }
                });

                const newAccessToken = data.access_token;
                
                if (newAccessToken) {
                    console.log("Interceptor: Token renovado com sucesso.");
                    
                    // Salva e Atualiza
                    setTokenFallback(newAccessToken);
                    setBroadcastToken(newAccessToken);
                    
                    // Atualiza o default para futuras requisições
                    api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
                    
                    // Libera a fila
                    processQueue(null, newAccessToken);
                    
                    // [CORREÇÃO CRÍTICA]
                    // Cria um NOVO objeto de config para o retry garantindo o header novo.
                    // Modificar originalRequest.headers diretamente pode falhar em algumas versões do Axios.
                    const retryConfig = {
                        ...originalRequest,
                        headers: {
                            ...originalRequest.headers,
                            'Authorization': `Bearer ${newAccessToken}`
                        }
                    };
                    
                    // Refaz a requisição original com o novo config
                    return api(retryConfig);
                }

            } catch (refreshError: any) {
                console.error("Interceptor: Falha no refresh. Deslogando...", refreshError);
                
                // Falha a fila
                processQueue(refreshError as AxiosError, null);
                
                // Limpa dados
                clearTokenFallback();
                setBroadcastToken(null);
                
                // Redireciona para login se não estiver lá
                if (!window.location.pathname.includes('/login')) {
                     window.location.replace('/login');
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;