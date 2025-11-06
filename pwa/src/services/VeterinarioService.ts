import api from './api';
import { Veterinario, CreateVetResponse, Provider } from './types';

// DTO para criar veterinário (baseado em gerenciarVeterinarios.tsx)
export interface CreateVetDto {
  nome: string;
  nome_completo: string;
  email: string;
  password?: string;
  crmv: string;
  especialidade?: string;
  telefone_emergencia?: string; // Corrigido de telefone_principal
  disponivel_24h: boolean;
  clinica_id: string; 
}

const VeterinarioService = {
  
  /**
   * Cria um novo usuário Veterinário VINCULADO a uma clínica.
   * Rota: POST /usuarios/veterinarios
   */
  createForClinica: async (vetData: CreateVetDto): Promise<CreateVetResponse> => {
    const response = await api.post<CreateVetResponse>('/usuarios/veterinarios', vetData);
    return response.data;
  },

  /**
   * Atualiza um veterinário.
   * Rota: PUT /veterinarios/{id}
   */
  update: async (id: number | string, vetData: Partial<Veterinario>): Promise<Veterinario> => {
    const response = await api.put<Veterinario>(`/veterinarios/${id}`, vetData);
    return response.data;
  },

  /**
   * Deleta um veterinário.
   * Rota: DELETE /veterinarios/{id}
   */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/veterinarios/${id}`);
  },

  /**
   * Busca veterinários autônomos próximos.
   * Rota: GET /veterinarios-autonomos
   */
  getAutonomos: async (lat?: number, lng?: number): Promise<Provider[]> => {
    // Adiciona lat/lng aos parâmetros apenas se ambos existirem
    const params = (lat && lng) ? { lat, lng } : {};
    
    const response = await api.get<Provider[]>('/veterinarios-autonomos', {
      params: params
    });
     // Mapeia para o tipo Provider
    return response.data.map(v => ({ ...v, tipo: 'veterinario' }));
  },
  
  /**
   * NOVO: Busca os dados do perfil do veterinário logado.
   * Rota: GET /veterinarios/meu (Rota customizada no backend)
   */
  getMeuPerfil: async (): Promise<Veterinario> => {
    const response = await api.get<Veterinario>('/veterinarios/meu');
    return response.data;
  },
  
  /**
   * NOVO: Atualiza os dados do veterinário.
   * Rota: PUT /veterinarios/{id}
   */
  updateVeterinario: async (id: number, data: Partial<Veterinario>): Promise<Veterinario> => {
    // Reutiliza o update original
    return VeterinarioService.update(id, data);
  },

  /**
   * NOVO: Faz upload da foto de perfil do veterinário.
   * Rota: POST /veterinarios/{id}/foto (Rota customizada no backend)
   */
  uploadFoto: async (id: number, file: File): Promise<{ foto_url: string }> => {
    const formData = new FormData();
    formData.append('foto', file);
    
    // O backend deve retornar a nova URL da foto salva
    const response = await api.post<{ foto_url: string }>(`/veterinarios/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default VeterinarioService;