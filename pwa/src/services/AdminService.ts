import api from './api';
import { Clinica, Usuario, Emergencia, Veterinario } from './types';

const AdminService = {
  
  // [NOVO] Aprovar Usuário
  approveUser: async (userId: number | string): Promise<void> => {
     await api.patch(`/usuarios/${userId}/approve`);
  },

  // --- Clínicas ---
  getAllClinicas: async (): Promise<Clinica[]> => {
    const response = await api.get<Clinica[]>('/clinicas');
    return response.data;
  },
  createClinica: async (data: Partial<Clinica> & { name: string, email: string, password: string }): Promise<Clinica> => {
    const payload = { ...data, tipo: 'clinica' };
    const response = await api.post('/auth/register', payload);
    // Se criado pelo admin, já aprova automaticamente
    if (response.data.id) {
         await api.patch(`/usuarios/${response.data.id}/approve`);
    }
    return response.data; 
  },
  updateClinica: async (id: number | string, data: Partial<Clinica>): Promise<Clinica> => {
    const response = await api.put<Clinica>(`/clinicas/${id}`, data);
    return response.data;
  },
  deleteClinica: async (id: number | string): Promise<void> => {
    await api.delete(`/clinicas/${id}`);
  },

  // --- Veterinários ---
  getAllVeterinarios: async (): Promise<Veterinario[]> => {
    const response = await api.get<Veterinario[]>('/veterinarios');
    return response.data;
  },
  createVeterinario: async (data: Partial<Veterinario> & { name: string, email: string, password: string }): Promise<Veterinario> => {
    const payload = { ...data, tipo: 'veterinario' };
    const response = await api.post('/auth/register', payload);
    if (response.data.id) {
         await api.patch(`/usuarios/${response.data.id}/approve`);
    }
    return response.data;
  },
  updateVeterinario: async (id: number | string, data: Partial<Veterinario>): Promise<Veterinario> => {
    const response = await api.put<Veterinario>(`/veterinarios/${id}`, data);
    return response.data;
  },
  deleteVeterinario: async (id: number | string): Promise<void> => {
    await api.delete(`/veterinarios/${id}`);
  },

  // --- Utilizadores ---
  getAllUsuarios: async (): Promise<Usuario[]> => {
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