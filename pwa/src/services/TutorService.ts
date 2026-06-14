import api from './api';
import { Tutor, Pet } from './types';

const TutorService = {
  
  /**
   * Busca um tutor pelo ID do usuário logado.
   * Rota: GET /tutor/meu
   */
  getMeuTutor: async (): Promise<Tutor> => {
    const response = await api.get<Tutor>(`/tutor/meu`);
    return response.data;
  },

  /**
   * Atualiza os dados de um tutor.
   * Rota: PUT/PATCH /tutores/{id}
   * Esta função estava faltando.
   */
  update: async (id: number, data: Partial<Tutor>): Promise<Tutor> => {
    const response = await api.put<Tutor>(`/tutores/${id}`, data);
    return response.data;
  },

  /**
   * Faz o upload da foto de perfil do tutor.
   * Rota: POST /tutores/{id}/foto
   * Esta função estava faltando.
   */
  uploadFoto: async (id: number, file: File): Promise<{ foto_url: string }> => {
    const formData = new FormData();
    formData.append('foto', file); // 'foto' é a chave esperada pelo TutorController.php
    
    const response = await api.post<{ foto_url: string }>(`/tutores/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Busca os pets de um tutor.
   * Rota: GET /tutores/{tutor}/pets
   */
  getPets: async (tutorId: number | string): Promise<Pet[]> => {
    const response = await api.get<Pet[]>(`/tutores/${tutorId}/pets`);
    const data = response.data;
    
    return Array.isArray(data) ? data : (data as any).pets || [];
  }
};

export default TutorService;