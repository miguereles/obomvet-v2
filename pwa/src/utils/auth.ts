import type { Usuario } from "../services/types";

export type AuthUser = Pick<Usuario, "id" | "name" | "email" | "tipo"> & {
  tutor_id: number | null;
  clinica_id: number | null;
  veterinario_id: number | null;
};

export function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + "token" + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getTokenFromLocalStorage(): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem("token");
  } catch (e) {
    return null;
  }
}

export function getToken(): string | null {
  return getTokenFromCookie() || getTokenFromLocalStorage();
}

export function getUser(): AuthUser | null {
  try {
    if (typeof localStorage === "undefined") return null;

    const id = localStorage.getItem("id");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const tipo = localStorage.getItem("tipo") as Usuario["tipo"] | null;
    const tutorId = localStorage.getItem("tutor_id");
    const clinicaId = localStorage.getItem("clinica_id");
    const veterinarioId = localStorage.getItem("veterinario_id");

    if (id && name && email && tipo) {
      const parsedId = Number(id);

      return {
        id: Number.isNaN(parsedId) ? 0 : parsedId,
        name,
        email,
        tipo,
        tutor_id: tutorId ? Number(tutorId) : null,
        clinica_id: clinicaId ? Number(clinicaId) : null,
        veterinario_id: veterinarioId ? Number(veterinarioId) : null,
      };
    }

    return null;
  } catch (e) {
    return null;
  }
}

export function setTokenFallback(token: string) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("token", token);
    }
  } catch (e) {
    console.error("Erro ao salvar token:", e);
  }
}

export function clearTokenFallback() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("id");
      localStorage.removeItem("name");
      localStorage.removeItem("email");
      localStorage.removeItem("tipo");
      localStorage.removeItem("tutor_id");
      localStorage.removeItem("clinica_id");
      localStorage.removeItem("veterinario_id");
    }
    if (typeof document !== "undefined") {
      document.cookie = "token=; Max-Age=0; path=/;";
    }
  } catch (e) {}
}

export function setUserFallback(data: {
  id: string | number;
  name: string;
  email: string;
  tipo: Usuario["tipo"];
  clinica_id?: number;
  veterinario_id?: number;
  tutor_id?: number;
}) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("id", data.id.toString());
      localStorage.setItem("name", data.name);
      localStorage.setItem("email", data.email);
      localStorage.setItem("tipo", data.tipo);

      if (data.tipo === "clinica" && data.clinica_id !== undefined && data.clinica_id !== null) {
        localStorage.setItem("clinica_id", data.clinica_id.toString());
      }
      if (data.tipo === "veterinario" && data.veterinario_id !== undefined && data.veterinario_id !== null) {
        localStorage.setItem("veterinario_id", data.veterinario_id.toString());
      }
      if (data.tipo === "tutor" && data.tutor_id !== undefined && data.tutor_id !== null) {
        localStorage.setItem("tutor_id", data.tutor_id.toString());
      }
    }
  } catch (e) {}
}

export function clearUserFallback() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("id");
      localStorage.removeItem("name");
      localStorage.removeItem("email");
      localStorage.removeItem("tipo");
      localStorage.removeItem("tutor_id");
      localStorage.removeItem("clinica_id");
      localStorage.removeItem("veterinario_id");
    }
  } catch (e) {}
}

export function authHeader(): Record<string, string> | undefined {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : undefined;
}
