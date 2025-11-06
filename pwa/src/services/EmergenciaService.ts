import api from './api';
import { Emergencia, CreateEmergenciaResponse } from './types';

const EmergenciaService = {
  
  /**
   * Cria uma nova emergência (logado ou anônimo).
   * Rota: POST /emergencias (de routes/api.php)
   */
  create: async (emergenciaData: any): Promise<CreateEmergenciaResponse> => {
    const response = await api.post<CreateEmergenciaResponse>('/emergencias', emergenciaData);
    return response.data;
  },

  /**
   * Busca emergências do tutor logado.
   * Rota: GET /minhas-emergencias (de routes/api.php)
   */
  getMinhasEmergencias: async (): Promise<Emergencia[]> => {
    // Seu routes/api.php define 'minhas-emergencias', mas o controller é 'meus'
    // Vou usar 'meus' (que está no seu EmergenciaController.php)
    // ADICIONE EM routes/api.php: Route::get('emergencias/meus', [EmergenciaController::class, 'meus']);
    const response = await api.get<Emergencia[]>('/emergencias/meus');
    return response.data;
  },

  /**
   * Busca emergências da clínica logada.
   * Rota: GET /emergencias/por-clinica (de EmergenciaController.php)
   */
  getEmergenciasDaClinica: async (): Promise<Emergencia[]> => {
    // Esta rota não está em routes/api.php, mas está no seu controller.
    // ADICIONE EM routes/api.php: Route::get('emergencias/por-clinica', [EmergenciaController::class, 'porClinica']);
    const response = await api.get<Emergencia[]>('/emergencias/por-clinica');
    return response.data;
  },

  /**
   * Atualiza uma emergência (status, etc.).
   * Rota: PUT /emergencias/{id} (de routes/api.php)
   */
  update: async (id: number | string, data: Partial<Emergencia>): Promise<Emergencia> => {
    // Seu emergenciaClinica.tsx usa PATCH /status, mas o apiResource é PUT /emergencias/{id}
    const response = await api.put<Emergencia>(`/emergencias/${id}`, data);
    return response.data;
  },

  /**
   * Deleta uma emergência.
   * Rota: DELETE /emergencias/{id} (de routes/api.php)
   */
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/emergencias/${id}`);
  }
};

export default EmergenciaService;