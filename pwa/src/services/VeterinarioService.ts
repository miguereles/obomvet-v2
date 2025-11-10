import api from './api';
import { Veterinario, CreateVetResponse, Provider } from './types';

// DTO para criar veterinário (baseado em gerenciarVeterinarios.tsx)
// ... (código existente) ...
export interface CreateVetDto {
  nome: string;
  nome_completo: string;
// ... (código existente) ...
  email: string;
  password?: string;
  crmv: string;
// ... (código existente) ...
  especialidade?: string;
  telefone_emergencia?: string; // Corrigido de telefone_principal
  disponivel_24h: boolean;
// ... (código existente) ...
  clinica_id: string; 
}

const VeterinarioService = {
// ... (código existente) ...
  
  /**
   * Cria um novo usuário Veterinário VINCULADO a uma clínica.
// ... (código existente) ...
   * Rota: POST /usuarios/veterinarios
   */
  createForClinica: async (vetData: CreateVetDto): Promise<CreateVetResponse> => {
// ... (código existente) ...
    const response = await api.post<CreateVetResponse>('/usuarios/veterinarios', vetData);
    return response.data;
  },

// ... (código existente) ...
  /**
   * Atualiza um veterinário.
   * Rota: PUT /veterinarios/{id}
// ... (código existente) ...
   */
  update: async (id: number | string, vetData: Partial<Veterinario>): Promise<Veterinario> => {
    const response = await api.put<Veterinario>(`/veterinarios/${id}`, vetData);
// ... (código existente) ...
    return response.data;
  },

  /**
// ... (código existente) ...
   * Deleta um veterinário.
   * Rota: DELETE /veterinarios/{id}
   */
// ... (código existente) ...
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/veterinarios/${id}`);
  },

// ... (código existente) ...
  /**
   * Busca veterinários autônomos próximos.
   * Rota: GET /veterinarios-autonomos
// ... (código existente) ...
   */
  getAutonomos: async (lat?: number, lng?: number): Promise<Provider[]> => {
    // Adiciona lat/lng aos parâmetros apenas se ambos existirem
// ... (código existente) ...
    const params = (lat && lng) ? { lat, lng } : {};
    
    const response = await api.get<Provider[]>('/veterinarios-autonomos', {
// ... (código existente) ...
      params: params
    });
     // Mapeia para o tipo Provider
// ... (código existente) ...
    return response.data.map(v => ({ ...v, tipo: 'veterinario' }));
  },
  
  /**
// ... (código existente) ...
   * NOVO: Busca os dados do perfil do veterinário logado.
   * Rota: GET /veterinarios/meu (Rota customizada no backend)
   */
  // ✅ Esta é a função que estamos a chamar
  getMeuPerfil: async (): Promise<Veterinario> => {
    const response = await api.get<Veterinario>('/veterinarios/meu');
    return response.data;
  },
  
// ... (código existente) ...
  /**
   * NOVO: Atualiza os dados do veterinário.
   * Rota: PUT /veterinarios/{id}
// ... (código existente) ...
   */
  updateVeterinario: async (id: number, data: Partial<Veterinario>): Promise<Veterinario> => {
    // Reutiliza o update original
// ... (código existente) ...
    return VeterinarioService.update(id, data);
  },

  /**
// ... (código existente) ...
   * NOVO: Faz upload da foto de perfil do veterinário.
   * Rota: POST /veterinarios/{id}/foto (Rota customizada no backend)
   */
// ... (código existente) ...
  uploadFoto: async (id: number, file: File): Promise<{ foto_url: string }> => {
    const formData = new FormData();
    formData.append('foto', file);
// ... (código existente) ...
    
    // O backend deve retornar a nova URL da foto salva
    const response = await api.post<{ foto_url: string }>(`/veterinarios/${id}/foto`, formData, {
// ... (código existente) ...
      headers: {
        'Content-Type': 'multipart/form-data',
      },
// ... (código existente) ...
    });
    return response.data;
  }
// ... (código existente) ...
};

export default VeterinarioService;