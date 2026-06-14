// services/PetService.ts
import api from "./api"; // Supondo que você tenha uma instância do axios configurada
import { Pet } from "./types";

export const PetService = {
  // Buscar todos (ou do tutor logado)
  getAll: async () => {
    const response = await api.get<Pet[]>("/pets");
    return response.data;
  },

  // Buscar um específico
  getById: async (id: number) => {
    const response = await api.get<Pet>(`/pets/${id}`);
    return response.data;
  },

  // Criar - Payload agora aceita sexo e castrado
  create: async (pet: Partial<Pet>) => {
    const response = await api.post("/pets", pet);
    return response.data;
  },

  // Atualizar
  update: async (id: number, pet: Partial<Pet>) => {
    const response = await api.put(`/pets/${id}`, pet);
    return response.data;
  },

  // Deletar
  delete: async (id: number) => {
    await api.delete(`/pets/${id}`);
  }
};