import api from './api';
import { Usuario } from './types';

const UsuarioService = {
  
  /**
   * Busca um usuário pelo ID.
   * Rota: GET /usuarios/{id} (de routes/api.php)
   */
  getById: async (id: string | number): Promise<Usuario> => {
    // ✅ CORREÇÃO: Removidos os 'params'. O backend (UsuarioController@show)
    // já carrega 'tutor', 'clinica' e 'veterinario' por padrão.
    const { data } = await api.get<Usuario>(`/usuarios/${id}`);
    return data;
  }
};

export default UsuarioService;