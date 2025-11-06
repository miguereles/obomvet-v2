import api from './api';
// Importa o tipo do seu arquivo local
import { AutofillResponse } from '../types/emergency.types'; 

const IaService = {
  
  /**
   * Envia áudio para transcrição.
   * Rota: POST /ia/transcribe (de routes/api.php)
   */
  transcribeAudio: async (formDataAudio: FormData): Promise<string> => {
    // Transcrição de áudio envia FormData, não JSON
    const response = await api.post('/ia/transcribe', formDataAudio, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // O controller da IA retorna um JSON { "text": "..." } ou o texto puro
    const data = response.data;
    if (data && data.text) {
      return data.text;
    }
    return data; // Fallback para texto puro
  },

  /**
   * Envia texto para análise da IA.
   * Rota: POST /ia/analyze (de routes/api.php)
   */
  analyzeText: async (text: string): Promise<AutofillResponse> => {
    const response = await api.post<AutofillResponse>('/ia/analyze', { text: text.trim() });
    // O controller da IA retorna o JSON direto (baseado em IAController.php)
    return response.data;
  }
};

export default IaService;