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
};

export default HistoricoService;