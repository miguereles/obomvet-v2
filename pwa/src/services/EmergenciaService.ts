import api from './api';
import { Emergencia, CreateEmergenciaResponse } from './types';

const EmergenciaService = {
  
  create: async (emergenciaData: any): Promise<CreateEmergenciaResponse> => {
    const response = await api.post<CreateEmergenciaResponse>('/emergencias', emergenciaData);
    return response.data;
  },

  getById: async (id: string): Promise<Emergencia> => {
    const response = await api.get<Emergencia>(`/emergencias/${id}`);
    return response.data;
  },

  getMinhasEmergencias: async (): Promise<Emergencia[]> => {
    const response = await api.get<Emergencia[]>('/emergencias/meus');
    return response.data;
  },

  getEmergenciasDaClinica: async (): Promise<Emergencia[]> => {
    const response = await api.get<Emergencia[]>('/emergencias/por-clinica');
    return response.data;
  },

  update: async (id: number | string, data: Partial<Emergencia>): Promise<Emergencia> => {
    const response = await api.put<Emergencia>(`/emergencias/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/emergencias/${id}`);
  }
};

export default EmergenciaService;