<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;

class IAController extends Controller
{
    /**
     * Autorização para uso público (chave secreta)
     */
    private function authorizePublic(Request $request)
    {
        $key = $request->header('X-PUBLIC-IA-KEY') ?? $request->input('key');
        if (!$key || $key !== env('PUBLIC_IA_KEY')) {
            abort(403, 'Acesso negado.');
        }
    }

    /**
     * Transcrição para usuários logados
     */
    public function transcribeUnified(Request $request)
    {
        if (!$request->user()) {
            $this->authorizePublic($request);
        }

        [$tutor, $pets] = $this->getTutorAndPets($request);
        $transcription = $this->transcribeAudio($request->file('file'));
        $prompt = $this->buildAutofillPrompt($tutor, $pets, $transcription);

        return $this->sendPromptToAI($prompt);
    }

    /**
     * Análise textual direta (sem áudio)
     */
    public function analyzeTextUnified(Request $request)
    {
        if (!$request->user()) {
            $this->authorizePublic($request);
        }

        $request->validate(['text' => 'required|string']);
        [$tutor, $pets] = $this->getTutorAndPets($request);
        $text = $request->input('text');
        $prompt = $this->buildAutofillPrompt($tutor, $pets, $text);

        return $this->sendPromptToAI($prompt);
    }

    /**
     * Obtém tutor e pets
     */
    private function getTutorAndPets(Request $request)
    {
        $user = $request->user();
        if ($user && $user->tipo === 'tutor') {
            $tutor = $user->tutor;
            $pets = $tutor ? ($tutor->pets ?? collect()) : collect();
            return [$tutor, $pets];
        }
        return [null, collect()];
    }

    /**
     * Transcreve áudio via Whisper
     */
    private function transcribeAudio($file)
    {
        if (!$file) abort(400, 'Nenhum arquivo enviado.');

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . env('OPENAI_API_KEY'),
        ])->attach(
            'file',
            fopen($file->getRealPath(), 'r'),
            $file->getClientOriginalName()
        )->post('https://api.openai.com/v1/audio/transcriptions', [
            'model' => 'whisper-1',
        ]);

        return $response->json()['text'] ?? '';
    }

    /**
     * Monta prompt contextual para o Agente OBomVet
     */
    private function buildAutofillPrompt($tutor, $pets, $transcription)
    {
        $tutorLogado = $tutor ? 'sim' : 'não';
        $temPet = ($pets && count($pets) > 0) ? 'sim' : 'não';

        $petsText = '';
        foreach ($pets as $pet) {
            $petsText .= "- nome: {$pet->nome}, especie: {$pet->especie}, raca: {$pet->raca}, data_nascimento: {$pet->data_nascimento}, peso: {$pet->peso}\n";
        }

        $tutorText = $tutor ? "- nome: {$tutor->nome_completo}, telefone: {$tutor->telefone_principal}, cpf: {$tutor->cpf}" : "nenhum";

        return <<<PROMPT
Tutor logado: {$tutorLogado}
Tutor tem pet cadastrado: {$temPet}
Dados do tutor logado (se houver):
{$tutorText}
Pets cadastrados:
{$petsText}

Relato transcrito:
"{$transcription}"
PROMPT;
    }

    /**
     * Envia prompt para o modelo GPT-4.1 (Agente OBomVet)
     * Agora retorna apenas o JSON puro da IA.
     */
    private function sendPromptToAI($prompt)
    {
        $agenteInstructions = <<<INSTRUCTIONS
Você é o **Agente OBomVet**, um assistente de triagem para emergências veterinárias. 
Analise cuidadosamente os dados recebidos e extraia as informações solicitadas para preencher o JSON completo.

# Contexto:
Você recebe:
- Relato textual de uma emergência (pode vir de áudio transcrito);
- Dados do tutor (caso esteja logado);
- Lista de pets cadastrados (pode estar vazia).

# Sua tarefa:
1. Se o tutor *não estiver logado*, extraia do relato:
   - nome do tutor,
   - telefone para contato,
   - nome, espécie e idade do animal.
2. Se o tutor estiver logado, use seus dados.
   Se ele *não tiver pets*, extraia do relato as informações do animal.
3. Analise o relato e identifique:
   - tipo de emergência (ex: atropelamento, intoxicação, sangramento, febre)
   - nível de urgência (alta, média, baixa)
   - ação recomendada imediata (ex: levar à clínica, manter aquecido, oferecer água)
   - descrição dos sintomas
   - possível local (endereço, rua, etc.)
   - se a visita deve ser presencial ou remota
   - diagnóstico preliminar
   - prescrição médica sugerida
   - estimativa de custo (se possível)

# Regras de resposta:
- Sempre preencha *todos* os campos do JSON (use null se faltar informação).
- O JSON deve estar **válido** e conter exatamente esta estrutura:

{
  "tutor": {
    "id": null,
    "nome": "...",
    "telefone": "..."
  },
  "animal": {
    "id": null,
    "nome": "...",
    "especie": "...",
    "idade": "...",
    "tem_cadastro": true
  },
  "emergencia": {
    "id": null,
    "pet_id": null,
    "tutor_id": null,
    "veterinario_id": null,
    "clinica_id": null,
    "descricao_sintomas": "...",
    "visita_tipo": "...",
    "localizacao": "...",
    "nivel_urgencia": "...",
    "status": "aberta",
    "data_abertura": "YYYY-MM-DDTHH:MM:SSZ",
    "data_conclusao": null,
    "diagnostico": "...",
    "prescricao_medica": "...",
    "custo_estimado": null
  }
}

# Modo de raciocínio:
1. Liste cada informação identificada (e explique como extraiu).
2. Descreva o raciocínio para determinar tipo e urgência da emergência.
3. Somente após isso, retorne o JSON final, completamente preenchido.

# Importante:
- "status" sempre inicia como "aberta".
- "data_abertura" deve conter a data/hora atual em ISO 8601.
- "pet_id" e "tutor_id" só devem ser preenchidos se existirem no sistema.
- Seja explicativo e coerente, mas o JSON final deve estar limpo (sem comentários).

INSTRUCTIONS;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . env('OPENAI_API_KEY'),
            'Content-Type' => 'application/json',
        ])->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-4.1',
            'messages' => [
                ['role' => 'system', 'content' => $agenteInstructions],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 1.0,
            'top_p' => 1.0,
            'max_tokens' => 2048,
        ]);

        // Extrai a resposta textual da IA
        $raw = $response->json('choices.0.message.content') ?? '';

        // Tenta encontrar apenas o JSON dentro do texto
        preg_match('/\{(?:[^{}]|(?R))*\}/s', $raw, $match);
        if (isset($match[0])) {
            $json = $match[0];
            $decoded = json_decode($json, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return response()->json($decoded);
            }
        }

        // Se não encontrou JSON válido, retorna erro
        return response()->json([
            'error' => 'Falha ao extrair JSON da resposta da IA',
            'raw' => $raw,
        ], 500);
    }
}