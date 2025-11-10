import api from './api';
import { Pet } from './types';

// ✅ CORREÇÃO: Alterado de 'const' para 'export const'
export const PetService = {

  /**
   * Cria um novo pet (logado ou anônimo).
   * Rota: POST /pets (de routes/api.php)
   */
  create: async (petData: Partial<Pet> & { tutor_nome?: string, tutor_telefone?: string }): Promise<Pet> => {
    // O PetController::store retorna { pet: Pet, edit_tokens?: ... }
    const response = await api.post('/pets', petData);
    if (response.data && response.data.pet) {
      return response.data.pet;
    }
    return response.data; // Fallback
  },

  /**
   * Atualiza um pet.
   * Rota: PUT /pets/{id} (de routes/api.php)
   */
  update: async (id: number | string, petData: Partial<Pet>): Promise<Pet> => {
    const response = await api.put<Pet>(`/pets/${id}`, petData);
    return response.data;
  },

  /**
   * Deleta um pet.
   * Rota: DELETE /pets/{id} (de routes/api.php)
   */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/pets/${id}`);
  }
};

// ❌ CORREÇÃO: O 'export default' é removido
// export default PetService;