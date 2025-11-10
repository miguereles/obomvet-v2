import api from './api';
import { Veterinario, Provider, Clinica } from './types';

const ClinicaService = {
  
  getById: async (id: string): Promise<Clinica> => {
// ... (código existente) ...
    const response = await api.get<Clinica>(`/clinicas/${id}`);
    return response.data;
  },

// ... (código existente) ...
  getVeterinarios: async (clinicaId: string): Promise<Veterinario[]> => {
    const response = await api.get<Veterinario[]>(`/clinicas/${clinicaId}/veterinarios`);
    return response.data;
// ... (código existente) ...
  },

  getPublicMapList: async (): Promise<Provider[]> => {
// ... (código existente) ...
    const response = await api.get<Clinica[]>('/clinicas-publicas');
    return response.data.map(c => ({
      ...c,
// ... (código existente) ...
      id: c.id,
      nome_fantasia: c.nome_fantasia,
      tipo: 'clinica',
// ... (código existente) ...
      localizacao: c.localizacao ? c.localizacao.replace("L:", "").replace("G:", "") : "0,0",
    }));
  },
  
  // ✅ Esta é a função que estamos a chamar
  getMinhaClinica: async (): Promise<Clinica> => {
    const response = await api.get<Clinica>('/clinicas/minha');
    return response.data;
  },

  updateClinica: async (id: number, data: Partial<Clinica>): Promise<Clinica> => {
// ... (código existente) ...
    const response = await api.put<Clinica>(`/clinicas/${id}`, data);
    return response.data;
  },

// ... (código existente) ...
  uploadFoto: async (id: number, file: File): Promise<{ foto_url: string }> => {
    const formData = new FormData();
    formData.append('foto', file);
// ... (código existente) ...
    
    const response = await api.post<{ foto_url: string }>(`/clinicas/${id}/foto`, formData, {
      headers: {
// ... (código existente) ...
        'Content-Type': 'multipart/form-data',
      },
    });
// ... (código existente) ...
    return response.data;
  }
};

export default ClinicaService;