// src/types/emergency.types.ts

// Mova todas as interfaces e tipos para cá
export interface Location {
  latitude: number;
  longitude: number;
}

export interface EmergencyForm {
  pet_id?: string;
  nome_pet?: string;
  descricao_sintomas: string;
  nivel_urgencia: "baixa" | "media" | "alta" | "critica";
}

export interface AutofillResponse {
  preenchidos?: Partial<EmergencyForm>;
  faltando?: string[];
}

export interface Clinica {
  id: number;
  nome_fantasia: string;
  telefone_principal: string;
  endereco?: string;
  localizacao?: string; // "latitude,longitude"
}

export type VisitaTipo = "clinica" | "domicilio";

export const URGENCIAS = ["baixa", "media", "alta", "critica"] as const;

