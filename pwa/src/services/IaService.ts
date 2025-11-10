import api from './api';
import { AIResponse, ChatMessage } from '../types/emergency.types'; 
import { getToken } from '../utils/auth';

const IaService = {
  
  transcribeAudio: async (formDataAudio: FormData): Promise<AIResponse> => {
    const token = getToken();
    const config: any = { headers: { 'Content-Type': 'multipart/form-data' } };

    if (!token) {
      const publicKey = (import.meta as any).env.VITE_PUBLIC_IA_KEY;
      if (!publicKey) console.error("VITE_PUBLIC_IA_KEY não está definida no .env do frontend!");
      config.headers['X-PUBLIC-IA-KEY'] = publicKey;
    }

    const response = await api.post<AIResponse>('/ia/transcribe', formDataAudio, config);
    return response.data;
  },

  analyzeText: async (text: string): Promise<AIResponse> => {
    const token = getToken();
    const config: any = {};

    if (!token) {
      const publicKey = (import.meta as any).env.VITE_PUBLIC_IA_KEY;
      if (!publicKey) console.error("VITE_PUBLIC_IA_KEY não está definida no .env do frontend!");
      config.headers = { 'X-PUBLIC-IA-KEY': publicKey };
    }
    
    const response = await api.post<AIResponse>('/ia/analyze', { text: text.trim() }, config);
    return response.data;
  },

  continueAnalysis: async (chat_history: ChatMessage[], response: string): Promise<AIResponse> => {
    const token = getToken();
    const config: any = {};

    if (!token) {
      const publicKey = (import.meta as any).env.VITE_PUBLIC_IA_KEY;
      if (!publicKey) console.error("VITE_PUBLIC_IA_KEY não está definida no .env do frontend!");
      config.headers = { 'X-PUBLIC-IA-KEY': publicKey };
    }

    const payload = {
      chat_history,
      response,
    };

    const apiResponse = await api.post<AIResponse>('/ia/continue', payload, config);
    return apiResponse.data;
  }
};

export default IaService;