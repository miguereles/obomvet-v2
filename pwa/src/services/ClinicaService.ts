import api from './api';
// Os tipos são baseados no seu snippet
import { Veterinario, Provider, Clinica } from './types';

const ClinicaService = {
  
  // ✅ --- INÍCIO DA CORREÇÃO ---
  // Adiciona a função 'getPublicClinics' que estava em falta
  // A página 'acompanhamentoEmergencia.tsx' precisa disto.
  getPublicClinics: async (): Promise<Clinica[]> => {
    // Esta rota '/clinicas-publicas' está definida no seu routes/api.php
    const response = await api.get<Clinica[]>('/clinicas-publicas');
    return response.data;
  },
  // ✅ --- FIM DA CORREÇÃO ---

  getById: async (id: string): Promise<Clinica> => {
    const response = await api.get<Clinica>(`/clinicas/${id}`);
    return response.data;
  },

  getVeterinarios: async (clinicaId: string): Promise<Veterinario[]> => {
    const response = await api.get<Veterinario[]>(`/clinicas/${clinicaId}/veterinarios`);
    return response.data;
  },

  getPublicMapList: async (): Promise<Provider[]> => {
    const response = await api.get<Clinica[]>('/clinicas-publicas');
    return response.data.map(c => ({
      ...c,
      id: c.id,
      nome_fantasia: c.nome_fantasia,
      tipo: 'clinica',
      localizacao: c.localizacao ? c.localizacao.replace("L:", "").replace("G:", "") : "0,0",
    }));
  },
  
  // ✅ Esta é a função que você já tinha
  getMinhaClinica: async (): Promise<Clinica> => {
    const response = await api.get<Clinica>('/clinicas/minha');
    return response.data;
  },

  updateClinica: async (id: number, data: Partial<Clinica>): Promise<Clinica> => {
    const response = await api.put<Clinica>(`/clinicas/${id}`, data);
    return response.data;
  },

  uploadFoto: async (id: number, file: File): Promise<{ foto_url: string }> => {
    const formData = new FormData();
    formData.append('foto', file);
    
    const response = await api.post<{ foto_url: string }>(`/clinicas/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default ClinicaService;