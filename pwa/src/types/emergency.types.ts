export interface Location {
  latitude: number;
  longitude: number;
}

export interface EmergencyForm {
  pet_id?: string;
  nome_pet?: string;
  descricao_sintomas: string;
}

export interface Clinica {
  id: number;
  nome_fantasia: string;
  telefone_principal: string;
  endereco?: string;
  localizacao?: string;
}

export type VisitaTipo = "clinica" | "domicilio";

export const URGENCIAS = ["baixa", "media", "alta", "critica"] as const;

export type UrgenciaNivel = typeof URGENCIAS[number];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIRelatorioFinal {
  tutor: {
    id: null;
    nome: string;
    telefone: string;
  };
  animal: {
    id: null;
    nome: string;
    especie: string;
    idade: string;
    tem_cadastro: boolean;
  };
  emergencia: {
    id: null;
    pet_id: null;
    tutor_id: null;
    veterinario_id: null;
    clinica_id: null;
    descricao_sintomas: string;
    visita_tipo: "presencial" | "remota" | string | null;
    localizacao: string | null;
    nivel_urgencia: UrgenciaNivel | string;
    status: "aberta";
    data_abertura: string;
    data_conclusao: null;
    diagnostico: string | null;
    prescricao_medica: string | null;
    custo_estimado: null;
    relatorio_detalhado_ia: string;
    materiais_provaveis: string;
  };
}

export interface AIPergunta {
  tipo: "pergunta";
  texto: string;
  chat_history: ChatMessage[];
}

export interface AIRespostaFinal {
  tipo: "relatorio_final";
  dados: AIRelatorioFinal;
  chat_history: ChatMessage[];
}

export type AIResponse = AIPergunta | AIRespostaFinal;