import axios, { InternalAxiosRequestConfig } from 'axios';
import { clearTokenFallback } from '../utils/auth'; // Importa sua função de limpar

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Adiciona o token JWT ao header se ele existir
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ [BLOCO CORRIGIDO]
// Trata erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    
    // Verifica se o erro é de autenticação
    const isAuthError = error.response && (
      // 1. O servidor respondeu corretamente com 401
      error.response.status === 401 ||
      
      // 2. OU o servidor respondeu incorretamente com 500, 
      //    mas a mensagem de erro é de "Não autenticado"
      (
        error.response.status === 500 &&
        error.response.data?.error && // Checa se 'data.error' existe
        typeof error.response.data.error === 'string' && // Garante que é uma string
        error.response.data.error.includes("Não autenticado")
      )
    );

    if (isAuthError) {
      console.warn(`Erro de autenticação detectado (Status: ${error.response.status}). Token expirado ou inválido. Deslogando.`);
      
      // Usa sua função utilitária para limpar tudo
      clearTokenFallback();
      
      // Recarrega a página de login
      // Adicionamos uma verificação para não causar um loop se já estivermos no /login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    
    // Repassa o erro para a função que o chamou (ex: openDetails)
    return Promise.reject(error);
  }
);

export default api;