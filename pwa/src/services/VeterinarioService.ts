import api from './api';
import { Veterinario, Emergencia, CreateVetDto, CreateVetResponse, Provider } from './types';

const VeterinarioService = {
    
    getVeterinarios: async (): Promise<Veterinario[]> => {
        const { data } = await api.get('/veterinarios');
        return data;
    },
    
    createForClinica: async (vetData: CreateVetDto): Promise<CreateVetResponse> => {
        const response = await api.post<CreateVetResponse>('/usuarios/veterinarios', vetData);
        return response.data;
    },

    update: async (id: number | string, vetData: Partial<Veterinario>): Promise<Veterinario> => {
        const response = await api.put<Veterinario>(`/veterinarios/${id}`, vetData);
        return response.data;
    },

    delete: async (id: number | string): Promise<void> => {
        await api.delete(`/veterinarios/${id}`);
    },

    getAutonomos: async (lat?: number, lng?: number): Promise<Provider[]> => {
        const params = (lat && lng) ? { lat, lng } : {};
        const response = await api.get<Provider[]>('/veterinarios-autonomos', {
            params: params
        });
        return response.data.map(v => ({ ...v, tipo: 'veterinario' }));
    },
    
    getMeuPerfil: async (): Promise<Veterinario> => {
        const response = await api.get<Veterinario>('/veterinarios/meu');
        return response.data;
    },
    
    updateVeterinario: async (id: number, data: Partial<Veterinario>): Promise<Veterinario> => {
        return VeterinarioService.update(id, data);
    },

    uploadFoto: async (id: number, file: File): Promise<{ foto_url: string }> => {
        const formData = new FormData();
        formData.append('foto', file);
        
        const response = await api.post<{ foto_url: string }>(`/veterinarios/${id}/foto`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getMinhasEmergencias: async (): Promise<Emergencia[]> => {
        const { data } = await api.get('/veterinario/emergencias/minhas');
        return data;
    },

    getEmergencias: async (veterinarioId: string | number): Promise<Emergencia[]> => {
        const { data } = await api.get(`/veterinarios/${veterinarioId}/emergencias`);
        return data;
    },

    acceptEmergencia: async (veterinarioId: number, emergenciaId: number): Promise<Emergencia> => {
        const { data } = await api.post<Emergencia>(`/veterinarios/${veterinarioId}/emergencias/${emergenciaId}/accept`);
        return data;
    },

    rejectEmergencia: async (veterinarioId: number, emergenciaId: number): Promise<any> => {
        const { data } = await api.post(`/veterinarios/${veterinarioId}/emergencias/${emergenciaId}/reject`);
        return data;
    }
};

export default VeterinarioService;