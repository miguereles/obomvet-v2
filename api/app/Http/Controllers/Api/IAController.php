<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IAController extends Controller
{
    private const OPENAI_TIMEOUT = 45;

    private function authorizePublic(Request $request)
    {
        $key = $request->header('X-PUBLIC-IA-KEY') ?? $request->input('key');
        if (!$key || $key !== env('PUBLIC_IA_KEY')) {
            // ✅ CORREÇÃO: Retorna um JSON 403 em vez de abort(403)
            return response()->json(['error' => 'Acesso negado. Chave de IA pública inválida.'], 403);
        }
        // ✅ CORREÇÃO: Retorna null em sucesso para permitir verificação
        return null;
    }

    public function transcribeUnified(Request $request)
    {
        if (!$request->user()) {
            // ✅ CORREÇÃO: Verifica a resposta do authorizePublic
            $authError = $this->authorizePublic($request);
            if ($authError) {
                return $authError;
            }
        }

        [$tutor, $pets] = $this->getTutorAndPets($request);
        
        $transcriptionResult = $this->transcribeAudio($request->file('file'));
        // ✅ CORREÇÃO: Verifica se a transcrição retornou um erro
        if (isset($transcriptionResult['error'])) {
            return response()->json($transcriptionResult, $transcriptionResult['status'] ?? 500);
        }
        $transcription = $transcriptionResult['text'] ?? '';
        
        if (empty($transcription)) {
             return response()->json([
                'error' => 'Falha ao transcrever o áudio. A gravação pode estar vazia ou o serviço de transcrição (Whisper) falhou.',
                'raw' => '',
            ], 500);
        }

        $chatHistory = $this->buildInitialChatHistory($tutor, $pets, $transcription);

        return $this->sendChatToAI($chatHistory);
    }

    public function analyzeTextUnified(Request $request)
    {
        if (!$request->user()) {
            // ✅ CORREÇÃO: Verifica a resposta do authorizePublic
            $authError = $this->authorizePublic($request);
            if ($authError) {
                return $authError;
            }
        }

        $request->validate(['text' => 'required|string']);
        [$tutor, $pets] = $this->getTutorAndPets($request);
        $text = $request->input('text');

        $chatHistory = $this->buildInitialChatHistory($tutor, $pets, $text);
        
        return $this->sendChatToAI($chatHistory);
    }

    public function continueAnalysis(Request $request)
    {
        if (!$request->user()) {
            // ✅ CORREÇÃO: Verifica a resposta do authorizePublic
            $authError = $this->authorizePublic($request);
            if ($authError) {
                return $authError;
            }
        }

        $validated = $request->validate([
            'chat_history' => 'required|array',
            'chat_history.*.role' => 'required|string|in:user,assistant',
            'chat_history.*.content' => 'required|string',
            'response' => 'required|string',
        ]);

        $chatHistory = $validated['chat_history'];
        
        $chatHistory[] = ['role' => 'user', 'content' => $validated['response']];

        return $this->sendChatToAI($chatHistory);
    }

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

    private function transcribeAudio($file)
    {
        if (!$file) {
            // ✅ CORREÇÃO: Retorna um array de erro
            return ['error' => 'Nenhum arquivo enviado.', 'status' => 400];
        }

        $apiKey = env('OPENAI_API_KEY');
        if (!$apiKey) {
            Log::error('OPENAI_API_KEY não está definida no .env para o Whisper (transcrição).');
            // ✅ CORREÇÃO: Retorna um erro 503 (Serviço Indisponível)
            return ['error' => 'Configuração de IA incompleta no servidor.', 'status' => 503];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
            ])->attach(
                'file',
                fopen($file->getRealPath(), 'r'),
                $file->getClientOriginalName()
            )->timeout(self::OPENAI_TIMEOUT)
             ->post('https://api.openai.com/v1/audio/transcriptions', [
                'model' => 'whisper-1',
            ]);

            if (!$response->successful()) {
                Log::error('Falha na API Whisper (transcribeAudio): ', $response->json() ?? ['raw' => $response->body()]);
                return ['error' => 'Falha no serviço de transcrição.', 'status' => 502];
            }

            // ✅ CORREÇÃO: Retorna o texto encapsulado
            return ['text' => $response->json()['text'] ?? ''];

        } catch (\Exception $e) {
            Log::error('Exceção em transcribeAudio: ' . $e->getMessage());
            return ['error' => 'Erro de conexão com o serviço de IA.', 'status' => 504]; // 504 Gateway Timeout
        }
    }

    private function buildInitialChatHistory($tutor, $pets, $transcription)
    {
        $tutorLogado = $tutor ? 'sim' : 'não';
        $temPet = ($pets && count($pets) > 0) ? 'sim' : 'não';

        $petsText = '';
        foreach ($pets as $pet) {
            $petsText .= "- nome: {$pet->nome}, especie: {$pet->especie}, raca: {$pet->raca}, data_nascimento: {$pet->data_nascimento}, peso: {$pet->peso}\n";
        }

        $tutorText = $tutor ? "- nome: {$tutor->nome_completo}, telefone: {$tutor->telefone_principal}, cpf: {$tutor->cpf}" : "nenhum";

        $initialPrompt = <<<PROMPT
Contexto:
Tutor logado: {$tutorLogado}
Tutor tem pet cadastrado: {$temPet}
Dados do tutor logado (se houver):
{$tutorText}
Pets cadastrados:
{$petsText}

Relato do tutor:
"{$transcription}"
PROMPT;

        return [
            ['role' => 'user', 'content' => $initialPrompt]
        ];
    }

    private function sendChatToAI(array $chatHistory)
    {
        $agenteInstructions = <<<INSTRUCTIONS
Você é o **Agente OBomVet**, um assistente de triagem veterinária sênior. Sua missão é conversar com um tutor (muitas vezes nervoso) para obter as informações necessárias e, em seguida, gerar um relatório JSON final para a clínica.

FLUXO DA CONVERSA ("PING-PONG"):

1.  ANÁLISE INICIAL: Você receberá o primeiro relato. Analise-o.
2.  DECISÃO (PERGUNTAR ou FINALIZAR):
    * Se o relato for VAGO (ex: "Meu cachorro passou mal") ou faltar informação CRÍTICA (ex: sintoma exato, o que ele comeu), você DEVE fazer UMA ÚNICA PERGUNTA de acompanhamento.
    * Se o relato for DETALHADO (ex: "Meu cachorro comeu chocolate e está tremendo"), você pode pular as perguntas e ir direto para o passo 3 (FINALIZAR).

3.  SE VOCÊ PERGUNTAR (PING):
    * Retorne APENAS um JSON no formato `{"tipo": "pergunta", "texto": "..."}`.
    * Exemplo: `{"tipo": "pergunta", "texto": "Entendido. O que exatamente ele ingeriu e quais sintomas ele está apresentando agora?"}`

4.  SE VOCÊ FINALIZAR (PONG):
    * Quando você tiver informações suficientes (seja do primeiro relato ou após a resposta do tutor), gere o relatório final.
    * O relatório DEVE ser um JSON no formato `{"tipo": "relatorio_final", "dados": {...}}`.
    * O objeto `dados` deve seguir a estrutura exata abaixo.

ESTRUTURA DO JSON (RELATÓRIO FINAL - `dados`):
{
  "tutor": { "id": null, "nome": "...", "telefone": "..." },
  "animal": { "id": null, "nome": "...", "especie": "...", "idade": "...", "tem_cadastro": false },
  "emergencia": {
    "id": null, "pet_id": null, "tutor_id": null, "veterinario_id": null, "clinica_id": null,
    "descricao_sintomas": "...",
    "visita_tipo": "presencial",
    "localizacao": "...",
    "nivel_urgencia": "...",
    "status": "aberta",
    "data_abertura": "YYYY-MM-DDTHH:MM:SSZ",
    "data_conclusao": null,
    "diagnostico": null,
    "prescricao_medica": null,
    "custo_estimado": null,
    "relatorio_detalhado_ia": "...",
    "materiais_provaveis": "..."
  }
}

IMPORTANTE: NUNCA copie o relato do tutor palavra por palavra. Sempre reescreva-o como um sumário clínico claro, objetivo e profissional para um veterinário. Use o relato do tutor apenas como base.

REGRAS PARA O RELATÓRIO FINAL:
-   `nivel_urgencia`: (critica, alta, media, baixa).
-   `relatorio_detalhado_ia` e `descricao_sintomas`: DEVEM conter o mesmo texto. Deve ser uma narrativa clínica coesa (2-4 frases) resumindo o caso. (Ex: "Animal ingeriu veneno. Apresenta vômito e tremores. Risco de intoxicação severa.")
-   `materiais_provaveis`: Liste o que a clínica deve preparar. (Ex: "Acesso IV, Carvão ativado, medicação antiemética.")
-   `data_abertura`: Deve ser a data/hora atual em ISO 8601.
-   `tutor` e `animal`: Preencha apenas se o tutor for anônimo (não logado).

Exemplo de "Ping-Pong":

1.  Usuário (Relato Vago): "...meu gato não está bem."
2.  IA (Resposta 1 - Pergunta): `{"tipo": "pergunta", "texto": "Sinto muito por isso. Para que eu possa ajudar, quais sintomas ele está apresentando? Ele comeu algo diferente ou sofreu algum acidente?"}`
3.  Usuário (Resposta): "Ele não consegue fazer xixi, fica indo na caixinha e chora."
4.  IA (Resposta 2 - Relatório Final): `{"tipo": "relatorio_final", "dados": { ... (JSON completo com urgência 'critica' e relatório sobre 'obstrução uretral') ... }}`

INSTRUCTIONS;

        $apiKey = env('OPENAI_API_KEY');
        if (!$apiKey) {
            Log::error('OPENAI_API_KEY não está definida no .env para o GPT (sendChatToAI).');
            // ✅ CORREÇÃO: Retorna um erro 503 (Serviço Indisponível)
            return response()->json(['error' => 'Configuração de IA incompleta no servidor.'], 503);
        }

        $fullHistory = array_merge(
            [['role' => 'system', 'content' => $agenteInstructions]],
            $chatHistory
        );

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(self::OPENAI_TIMEOUT)
              ->post('https://api.openai.com/v1/chat/completions', [
                'model' => env('OPENAI_CHAT_MODEL', 'gpt-4o-mini'), 
                'messages' => $fullHistory,
                'temperature' => 0.7, 
                'top_p' => 1.0,
                'max_tokens' => 2048,
            ]);
        
            if (!$response->successful()) {
                $errorData = $response->json() ?? ['raw' => $response->body()];
                Log::error('Falha na API OpenAI (sendChatToAI): ', $errorData);
                return response()->json([
                    'error' => 'O serviço de IA falhou ao processar a requisição. Verifique os logs do servidor.',
                    'raw_error' => $errorData,
                ], 502); // 502 Bad Gateway
            }

            $raw = $response->json('choices.0.message.content') ?? '';

        } catch (\Exception $e) {
            Log::error('Exceção em sendChatToAI: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro de conexão com o serviço de IA.',
                'raw_error' => $e->getMessage(),
            ], 504); // 504 Gateway Timeout
        }


        if (empty($raw)) {
             Log::warning('A resposta da OpenAI foi bem-sucedida, mas o conteúdo (choices.0.message.content) está vazio.', $response->json());
        }

        preg_match('/\{(?:[^{}]|(?R))*\}/s', $raw, $match);
        if (isset($match[0])) {
            $json = $match[0];
            $decoded = json_decode($json, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                
                $decoded['chat_history'] = array_merge(
                    $chatHistory,
                    [['role' => 'assistant', 'content' => $json]]
                );
                return response()->json($decoded);
            }
        }

        Log::error('Não foi possível extrair um JSON válido da resposta da IA.', ['raw' => $raw]);
        return response()->json([
            'error' => 'Falha ao extrair JSON da resposta da IA',
            'raw' => $raw,
        ], 500);
    }
}