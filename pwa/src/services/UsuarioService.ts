import api from './api';
import { Usuario } from './types';

const UsuarioService = {
  
  /**
   * Busca um usuário pelo ID.
   * Rota: GET /usuarios/{id} (de routes/api.php)
   */
  getById: async (id: string | number): Promise<Usuario> => {
    // ✅ CORREÇÃO: Adicionamos 'params' para pedir ao backend (Laravel)
    // que inclua os relacionamentos 'clinica' e 'veterinario' no JSON.
    const { data } = await api.get<Usuario>(`/usuarios/${id}`, {
      params: {
        with: ['clinica', 'veterinario']
      }
    });
    return data;
  }
};

export default UsuarioService;