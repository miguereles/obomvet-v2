import api from './api';
import { HistoricoAtendimento } from './types';

const HistoricoService = {

  /**
   * Busca históricos do tutor logado.
   * Rota: GET /meus-historicos (de routes/api.php)
   */
  getMeusHistoricos: async (): Promise<HistoricoAtendimento[]> => {
    const response = await api.get<HistoricoAtendimento[]>('/meus-historicos');
    return response.data;
  }

  /**
   * Cria um histórico relacionado a uma emergência específica
   * Rota backend: POST /emergencias/{emergencia}/historicos
   */
  , createForEmergencia: async (emergenciaId: number | string, payload: Partial<HistoricoAtendimento>): Promise<HistoricoAtendimento> => {
    const response = await api.post<HistoricoAtendimento>(`/emergencias/${emergenciaId}/historicos`, payload);
    return response.data;
  }
};

export default HistoricoService;