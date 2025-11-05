import { Location, Pet } from "../types/emergency.types";

/**
 * Limpa uma string que pode conter marcação de JSON.
 */
const cleanJson = (text: string): object | null => {
  const cleanedText = text.replace(/^```json\s*|```$/gs, "").trim();
  try {
    const parsed = JSON.parse(cleanedText);
    if (typeof parsed === "object" && parsed !== null) return parsed;
    console.warn("JSON parseado não é um objeto:", parsed);
    return null;
  } catch (e) {
    console.warn("Falha inicial ao parsear JSON:", e);
    const match = cleanedText.match(/\{[\s\S]*\}/);
    if (match && match[0]) {
      try {
        const parsedMatch = JSON.parse(match[0]);
        if (typeof parsedMatch === "object" && parsedMatch !== null)
          return parsedMatch;
        console.warn("JSON da string não é objeto:", parsedMatch);
        return null;
      } catch (e2) {
        console.error("Falha ao parsear JSON da string:", e2);
        return null;
      }
    }
    console.error("Nenhum JSON encontrado:", cleanedText);
    return null;
  }
};

/**
 * Busca os pets do usuário.
 */
export async function fetchPets(token: string): Promise<Pet[]> {
  const res = await fetch("http://localhost:8000/api/pets", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Falha ao buscar pets (${res.status})`);
  const data = await res.json();
  if (Array.isArray(data)) {
    return data.map((pet) => ({ ...pet, id: String(pet.id) }));
  }
  console.warn("Resposta da API de pets não é um array:", data);
  return [];
}

/**
 * Envia o áudio para transcrição.
 */
export async function transcribeAudio(
  formDataAudio: FormData,
  token: string | null
): Promise<string> {
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch("http://localhost:8000/api/ia/transcribe", {
    method: "POST",
    body: formDataAudio,
    headers: headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Falha na transcrição (${res.status}): ${errorText || res.statusText}`
    );
  }

  const text = await res.text();
  const dataParsed = cleanJson(text);

  if (dataParsed && typeof (dataParsed as any).text === "string") {
    return (dataParsed as any).text;
  }
  if (typeof text === "string" && text.trim().length > 0) {
    return text;
  }
  throw new Error("Não foi possível processar texto transcrito.");
}

/**
 * Envia o texto para análise da IA.
 */
export async function analyzeSymptoms(text: string, token: string | null) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const res = await fetch("http://localhost:8000/api/ia/analyze", {
    method: "POST",
    headers,
    body: JSON.stringify({ text: text.trim() }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro API análise (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  const aiContent = data?.choices?.[0]?.message?.content || data?.content || data;
  const parsed =
    typeof aiContent === "string"
      ? cleanJson(aiContent)
      : typeof aiContent === "object"
      ? aiContent
      : null;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    (!("preenchidos" in parsed) && !("faltando" in parsed))
  ) {
    console.error("Resposta IA não é AutofillResponse:", parsed);
    throw new Error("Formato inesperado da resposta IA.");
  }
  return parsed;
}

/**
* Cria um novo pet para o usuário logado.
*/
export async function createPet(petName: string, token: string): Promise<string> {
  const createPetUrl = "http://localhost:8000/api/pets";
  // CORREÇÃO: Envia 'especie' como 'N/A' para satisfazer a validação 'required'
  // e a restrição 'NOT NULL' do banco de dados.
  const createPetPayload = { 
    nome: petName.trim(),
    especie: 'N/A' 
  };
  const resPet = await fetch(createPetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(createPetPayload),
  });

  const dataPet = await resPet.json();

  if (!resPet.ok) {
    if (resPet.status === 422 && dataPet.errors) {
      const firstErrorMsg = Object.values(dataPet.errors).flat()[0] as string;
      throw new Error(firstErrorMsg || "Erro de validação ao criar pet.");
    }
    throw new Error(`Erro criar pet (${resPet.status}): ${dataPet.error || 'Erro desconhecido'}`);
}

  const newPetId = dataPet?.id;
  if (!newPetId) throw new Error("ID novo pet não encontrado na resposta.");
  return String(newPetId);
}

/**
 * Envia o relatório de emergência final.
 */
export async function submitEmergency(
  payload: any,
  token: string | null
): Promise<any> {
  const url = "http://localhost:8000/api/emergencias";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }; // <-- CORREÇÃO: 'G' removido
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`Erro ${res.status}:`, data);
    if (res.status === 422) {
      throw new Error(
        (Object.values(data.errors || {}).flat()[0] as string) ||
          "Erro nos dados enviados."
      );
    } else if (res.status === 401 || res.status === 403) {
      throw new Error("Não autorizado.");
    } else {
      throw new Error(data.error || `Erro no servidor (${res.status}).`);
    }
  }
  return data;
}