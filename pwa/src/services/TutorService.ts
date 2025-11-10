import api from './api';
import { Tutor, Pet } from './types';

const TutorService = {
  
  /**
   * Busca um tutor pelo ID do usuário logado.
   * Rota: GET /tutor/meu (de routes/api.php)
   */
  // ✅ Esta é a função que estamos a chamar
  getMeuTutor: async (): Promise<Tutor> => {
    const response = await api.get<Tutor>(`/tutor/meu`);
    return response.data;
  },

  /**
   * Busca os pets de um tutor.
   * Rota: GET /tutores/{tutor}/pets (de routes/api.php)
   */
  getPets: async (tutorId: number | string): Promise<Pet[]> => {
    const response = await api.get<Pet[]>(`/tutores/${tutorId}/pets`);
    // O controller TutorController::getPets retorna o array de pets diretamente.
    const data = response.data;
    
    // O componente petDashboard.tsx espera { pets: [] } ou array.
    return Array.isArray(data) ? data : (data as any).pets || [];
  }
};

export default TutorService;