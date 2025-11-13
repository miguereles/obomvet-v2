// Define os tipos de dados centrais da sua aplicação

export interface Usuario {
  id: number;
  name: string;
  nome_completo?: string;
  email: string;
  tipo: 'tutor' | 'veterinario' | 'clinica';
  telefone_principal?: string;
  // Relacionamentos que podem ser carregados
  tutor?: Tutor;
  veterinario?: Veterinario;
  clinica?: Clinica;
}

export interface Tutor {
  id: number;
  usuario_id: number | null; // Pode ser nulo para tutores anônimos
  nome_completo: string;
  telefone_principal: string;
  telefone_alternativo?: string;
  cpf: string;
  // Propriedades de token anônimo
  anonymous_edit_token?: string;
  anonymous_edit_token_expires_at?: string;
  // Relacionamentos
  pets?: Pet[];
  emergencias?: Emergencia[];
}

export interface Pet {
  id: number;
  tutor_id: number | null;
  nome: string;
  especie: string;
  raca?: string;
  data_nascimento?: string | null;
  idade?: number; // Campo calculado no frontend
  peso?: number;
  alergias?: string | null;
  medicamentos_continuos?: string | null;
  cuidados_especiais?: string | null;
  anonymous_edit_token?: string;
  anonymous_edit_token_expires_at?: string;
}

export interface Clinica {
  id: number;
  usuario_id: number;
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  endereco?: string;
  telefone_principal?: string;
  telefone_emergencia?: string;
  email_contato?: string;
  horario_funcionamento?: string;
  disponivel_24h: boolean;
  localizacao?: string; // "lat,lng"
  publica: boolean;
  descricao?: string; // NOVO: Campo de descrição
  foto_url?: string; // NOVO: URL da foto de perfil
  // Relacionamentos
  veterinarios?: Veterinario[];
}

export interface Veterinario {
  id: number;
  usuario_id: number;
  clinica_id?: number | null;
  nome_completo: string;
  crmv: string;
  especialidade?: string;
  telefone_emergencia: string;
  disponivel_24h: boolean;
  autonomo: boolean;
  area_atuacao?: any; // JSON
  endereco?: string;
  lat?: number;
  lng?: number;
  descricao?: string; // NOVO: Campo de descrição
  foto_url?: string; // NOVO: URL da foto de perfil
  // Campos do relacionamento 'user' que seu frontend espera
  email?: string; 
  // Alias que seu frontend usa
  telefone_principal?: string;
}

export interface Emergencia {
  id: number;
  pet_id?: number | null;
  tutor_id?: number | null;
  veterinario_id?: number | null;
  clinica_id?: number | null;
  descricao_sintomas: string;
  visita_tipo?: 'domicilio' | 'clinica' | null;
  localizacao?: string | null;
  nivel_urgencia: 'baixa' | 'media' | 'alta' | 'critica';
  // O backend usa 'aberta', mas o frontend 'emergenciaClinica' usa 'pendente'
  status: 'aberta' | 'em_atendimento' | 'concluida' | 'cancelada' | 'assigned' | 'accepted' | 'rejected' | 'pendente';
  data_abertura: string;
  data_conclusao?: string | null;
  // Relacionamentos carregados
  pet?: { nome: string };
  tutor?: { nome_completo: string };
  clinica?: Clinica;
  // Campos que seus componentes usam
  pet_nome?: string; // Alias de `emergenciaDashboard.tsx`
  created_at?: string; // Alias de `emergenciaClinica.tsx`
}

export interface HistoricoAtendimento {
  id: number;
  emergencia_id: number;
  veterinario_id: number;
  acao_realizada: string;
  data_acao: string;
  // Relacionamentos carregados
  emergencia?: {
    id: number;
    pet?: { nome: string };
  };
  veterinario?: {
    nome_completo: string; // Baseado no seu Model
  };
}


// --- Tipos de Resposta de API ---

/**
 * Resposta do AuthController::login (baseado em login.tsx e AuthController)
 */
export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  id: number;
  name: string;
  email: string;
  tipo: 'tutor' | 'veterinario' | 'clinica';
  clinica_id?: number;
  veterinario_id?: number;
  tutor_id?: number;
}

/**
 * Resposta do AuthController::register
 */
export interface RegisterResponse extends LoginResponse {
  message: string;
  usuario: Usuario;
}

/**
 * Resposta do UsuarioController::storeVeterinario
 */
export interface CreateVetResponse {
  usuario: Usuario;
  veterinario: Veterinario;
}

/**
 * Resposta do EmergenciaController::store
 * [CORRIGIDO]
 */
export interface CreateEmergenciaResponse {
  emergencia: Emergencia;
  clinica: Clinica;
  public_uuid?: string; // [LINHA ADICIONADA] - Estava em falta
  edit_tokens?: {
    tutor?: string;
    pet?: string;
  };
}

/**
 * Para o ClinicSelectModal (baseado em ClinicaController::indexPublic e VeterinarioController::getAutonomos)
 */
export interface Provider {
  id: number;
  nome_fantasia?: string; // Clinica
  nome_completo?: string; // Veterinario
  endereco?: string;
  localizacao: string;
  telefone_emergencia: string;
  disponivel_24h?: boolean;
  publica?: boolean; // Clinica
  distancia?: number; // Calculado
  avaliacao?: number; // Veterinario
  tipo: 'clinica' | 'veterinario';
  descricao?: string; // NOVO: Adicionado aqui
  foto_url?: string; // NOVO: Adicionado aqui
}

/**
 * DTO (Data Transfer Object) para criar Veterinário
 * (Baseado em gerenciarVeterinarios.tsx)
 */
export interface CreateVetDto {
  nome: string; // Vem do nome_completo
  nome_completo: string;
  email: string;
  password?: string;
  crmv: string;
  especialidade?: string;
  telefone_emergencia?: string;
  disponivel_24h: boolean;
  clinica_id: string;
}