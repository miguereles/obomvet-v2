import axios, { InternalAxiosRequestConfig } from 'axios';
import { clearTokenFallback } from '../utils/auth'; // Importa sua função de limpar

const API_BASE_URL = '/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Adiciona o token JWT ao header se ele existir
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Seu login.tsx salva o token como 'token'
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se não autenticado (token expirado/inválido)
    if (error.response?.status === 401) {
      console.warn("Erro 401: Token inválido or expirado. Deslogando.");
      // Usa sua função utilitária para limpar tudo
      clearTokenFallback();
      // Recarrega a página de login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;