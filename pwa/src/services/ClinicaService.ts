import api from './api';
import { Veterinario, Provider, Clinica } from './types';

const ClinicaService = {
  
  /**
   * Busca os veterinários de uma clínica específica.
   * Rota: GET /clinicas/{clinica}/veterinarios (de routes/api.php)
   */
  getVeterinarios: async (clinicaId: string): Promise<Veterinario[]> => {
    const response = await api.get<Veterinario[]>(`/clinicas/${clinicaId}/veterinarios`);
    // Seu backend não retorna o 'email' no Vet, só no Usuário.
    // O componente 'gerenciarVeterinarios' espera o email.
    // Idealmente, o backend faria um join.
    // Por enquanto, o componente 'handleEdit' lidará com isso.
    return response.data;
  },

  /**
   * Busca a lista pública de clínicas para o mapa.
   * Rota: GET /clinicas-publicas (de routes/api.php)
   */
  getPublicMapList: async (): Promise<Provider[]> => {
    const response = await api.get<Clinica[]>('/clinicas-publicas');
    // Mapeia a resposta da Clinica para o tipo Provider genérico
    return response.data.map(c => ({
      ...c,
      id: c.id,
      nome_fantasia: c.nome_fantasia,
      tipo: 'clinica',
      // Garante que a localização é uma string "lat,lng"
      localizacao: c.localizacao ? c.localizacao.replace("L:", "").replace("G:", "") : "0,0",
    }));
  },
  
  /**
   * NOVO: Busca os dados da clínica logada.
   * Rota: GET /clinicas/minha (Rota customizada no backend)
   */
  getMinhaClinica: async (): Promise<Clinica> => {
    const response = await api.get<Clinica>('/clinicas/minha');
    return response.data;
  },

  /**
   * NOVO: Atualiza os dados da clínica.
   * Rota: PUT /clinicas/{id}
   */
  updateClinica: async (id: number, data: Partial<Clinica>): Promise<Clinica> => {
    const response = await api.put<Clinica>(`/clinicas/${id}`, data);
    return response.data;
  },

  /**
   * NOVO: Faz upload da foto de perfil da clínica.
   * Rota: POST /clinicas/{id}/foto (Rota customizada no backend)
   */
  uploadFoto: async (id: number, file: File): Promise<{ foto_url: string }> => {
    const formData = new FormData();
    formData.append('foto', file);
    
    // O backend deve retornar a nova URL da foto salva
    const response = await api.post<{ foto_url: string }>(`/clinicas/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default ClinicaService;