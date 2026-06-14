import type { Emergencia } from "../services/types";

export type EmergencyStatus = Emergencia["status"];

const ACTIVE_STATUS = new Set<EmergencyStatus>([
  "aberta",
  "assigned",
  "accepted",
  "em_atendimento",
  "pendente",
]);

const STATUS_ALIASES: Record<string, EmergencyStatus> = {
  aberta: "aberta",
  pending: "aberta",
  pendente: "aberta",
  assigned: "assigned",
  accepted: "accepted",
  em_andamento: "em_atendimento",
  em_atendimento: "em_atendimento",
  concluidas: "concluida",
  concluida: "concluida",
  finalizada: "concluida",
  rejected: "cancelada",
  cancelada: "cancelada",
};

export function normalizeEmergencyStatus(status?: string | null): EmergencyStatus {
  if (!status) return "aberta";

  const normalized = status.trim().toLowerCase();
  return STATUS_ALIASES[normalized] ?? (normalized as EmergencyStatus);
}

export function isEmergencyActive(status?: string | null): boolean {
  return ACTIVE_STATUS.has(normalizeEmergencyStatus(status));
}

export function getEmergencyTimelineStep(status?: string | null): number {
  const normalized = normalizeEmergencyStatus(status);

  if (normalized === "concluida") return 3;
  if (normalized === "em_atendimento" || normalized === "accepted") return 2;
  if (normalized === "pendente" || normalized === "assigned") return 1;
  return 0;
}

export function getEmergencyStatusLabel(status?: string | null): string {
  const normalized = normalizeEmergencyStatus(status);

  switch (normalized) {
    case "aberta":
      return "Solicitado";
    case "assigned":
    case "pendente":
      return "Aguardando";
    case "accepted":
    case "em_atendimento":
      return "Em atendimento";
    case "concluida":
      return "Finalizado";
    case "cancelada":
      return "Cancelada";
    default:
      return "Solicitado";
  }
}

export function getActiveEmergencyStatuses(): EmergencyStatus[] {
  return [...ACTIVE_STATUS];
}
