import api from './api';
// Usando as suas tipagens mais recentes
import { Emergencia, CreateEmergenciaResponse } from './types'; 

const EmergenciaService = {
  
  // A sua função 'create' (está correta)
  create: async (emergenciaData: any): Promise<CreateEmergenciaResponse> => {
    const response = await api.post<CreateEmergenciaResponse>('/emergencias', emergenciaData);
    return response.data;
  },

  // A sua função 'getById' (protegida, para utilizadores logados)
  getById: async (id: string): Promise<Emergencia> => {
    const response = await api.get<Emergencia>(`/emergencias/${id}`);
    return response.data;
  },

  // [FUNÇÃO CRÍTICA ADICIONADA]
  // Esta função estava em falta na sua versão.
  // A página 'acompanhamentoEmergencia.tsx' (src/pages/acompanhamentoEmergencia.tsx) precisa dela para o fluxo anónimo.
  getPublicByUuid: async (uuid: string): Promise<{ emergencia: Emergencia, clinica: any }> => {
    // Esta rota '/emergencias/publico/{uuid}' foi definida em 'routes/api.php'
    const response = await api.get(`/emergencias/publico/${uuid}`);
    return response.data; // Retorna { emergencia: {...}, clinica: {...} }
  },

  // A sua função 'getMinhasEmergencias' (está correta)
  getMinhasEmergencias: async (): Promise<Emergencia[]> => {
    const response = await api.get<Emergencia[]>('/emergencias/meus');
    return response.data;
  },

  // A sua função 'getEmergenciasDaClinica' (está correta)
  getEmergenciasDaClinica: async (): Promise<Emergencia[]> => {
    const response = await api.get<Emergencia[]>('/emergencias/por-clinica');
    return response.data;
  },

  // A sua função 'update' (está correta)
  update: async (id: number | string, data: Partial<Emergencia>): Promise<Emergencia> => {
    const response = await api.put<Emergencia>(`/emergencias/${id}`, data);
    return response.data;
  },

  // A sua função 'delete' (está correta)
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/emergencias/${id}`);
  }
};

export default EmergenciaService;