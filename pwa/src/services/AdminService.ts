import api from './api';
import { Clinica, Usuario, Emergencia, Veterinario } from './types'; // Importa Veterinario

const AdminService = {
  
  // --- Clínicas ---
  getAllClinicas: async (): Promise<Clinica[]> => {
    const response = await api.get<Clinica[]>('/clinicas');
    return response.data;
  },
  updateClinica: async (id: number | string, data: Partial<Clinica>): Promise<Clinica> => {
    const response = await api.put<Clinica>(`/clinicas/${id}`, data);
    return response.data;
  },
  deleteClinica: async (id: number | string): Promise<void> => {
    await api.delete(`/clinicas/${id}`);
  },

  // --- Utilizadores ---
  getAllUsuarios: async (): Promise<Usuario[]> => {
    // Esta rota agora retorna os 'perfis' (veterinario, clinica, tutor)
    const response = await api.get<Usuario[]>('/usuarios');
    return response.data;
  },
  updateUsuario: async (id: number | string, data: Partial<Usuario>): Promise<Usuario> => {
    const response = await api.put<Usuario>(`/usuarios/${id}`, data);
    return response.data;
  },
  deleteUsuario: async (id: number | string): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
  },

  // ✅ --- Veterinários (NOVO) ---
  getAllVeterinarios: async (): Promise<Veterinario[]> => {
    // Chama o novo VeterinarioController@index
    const response = await api.get<Veterinario[]>('/veterinarios');
    return response.data;
  },
  updateVeterinario: async (id: number | string, data: Partial<Veterinario>): Promise<Veterinario> => {
    const response = await api.put<Veterinario>(`/veterinarios/${id}`, data);
    return response.data;
  },
  deleteVeterinario: async (id: number | string): Promise<void> => {
    await api.delete(`/veterinarios/${id}`);
  },
  // ✅ --- Fim do Novo Bloco ---

  // --- Emergências ---
  getAllEmergencias: async (): Promise<Emergencia[]> => {
    const response = await api.get<Emergencia[]>('/emergencias');
    return response.data;
  },
  deleteEmergencia: async (id: number | string): Promise<void> => {
    await api.delete(`/emergencias/${id}`);
  },

};

export default AdminService;