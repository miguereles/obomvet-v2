import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
// Importa as funções que manipulam o localStorage
import { clearTokenFallback, setTokenFallback } from '../utils/auth.ts'; 
// Importa a função que atualiza o token do Echo
import { setBroadcastToken } from './echo.ts';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Interceptor de REQUISIÇÃO: Adiciona o token JWT ao header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


// --- LÓGICA DE REFRESH TOKEN (Interceptor de RESPOSTA) ---

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
        if (!originalRequest) return Promise.reject(error);

        // Verifica se foi 401 E não é uma tentativa de refresh (evita loop)
        if (error.response?.status === 401 && originalRequest.url !== '/auth/refresh') {
            
            if (isRefreshing) {
                // Se já estamos buscando um token novo, bota na fila
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers!['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            // Marca que estamos buscando um token novo
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                console.log("Interceptor: Token expirado. Buscando novo token...");
                // Chama a rota de refresh diretamente
                const { data } = await api.post('/auth/refresh');
                const newAccessToken = data.access_token;
                
                if (newAccessToken) {
                    console.log("Interceptor: Token renovado.");
                    // Salva o novo token
                    setTokenFallback(newAccessToken);
                    setBroadcastToken(newAccessToken);
                    
                    // Atualiza o header da requisição original
                    api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
                    originalRequest.headers!['Authorization'] = 'Bearer ' + newAccessToken;
                    
                    // Libera a fila com o novo token
                    processQueue(null, newAccessToken);
                    
                    // Tenta a requisição original novamente
                    return api(originalRequest);
                } else {
                     throw new Error("Resposta de refresh não continha access_token");
                }

            } catch (refreshError: any) {
                console.error("Interceptor: Falha ao renovar token. Deslogando.", refreshError);
                // Se o refresh falhar, desloga o usuário
                processQueue(refreshError as AxiosError, null);
                clearTokenFallback();
                setBroadcastToken(null);
                
                if (window.location.pathname !== '/login') {
                     window.location.href = '/login';
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Para qualquer outro erro (500, 404, 422 etc.), apenas rejeite
        return Promise.reject(error);
    }
);

export default api;