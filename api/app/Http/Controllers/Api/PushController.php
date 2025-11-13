<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use App\Models\Usuario;
use App\Models\Tutor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PushController extends Controller
{
    /**
     * [MÉTODO ATUALIZADO]
     * Salva a assinatura Web Push no Tutor (logado ou anónimo).
     */
    public function store(Request $request)
    {
        // ✅ === INÍCIO DA CORREÇÃO ===
        // Alteramos a validação para corresponder ao que o PushService.ts envia
        // (endpoint, public_key, auth_token) e removemos a regra 'unique'.
        $validated = $request->validate([
            'endpoint' => 'required|string',
            'public_key' => 'nullable|string', // Era 'keys.p256dh'
            'auth_token' => 'nullable|string', // Era 'keys.auth'
            'tutor_token' => 'nullable|string|exists:tutors,anonymous_edit_token',
        ]);
        // ✅ === FIM DA CORREÇÃO ===

        $notifiableTutor = null;

        // Caso 1: Utilizador está logado
        $user = Auth::guard('api')->user();
        if ($user && $user->tutor) {
            $notifiableTutor = $user->tutor;
        } 
        // Caso 2: Utilizador é anónimo (ex: página de acompanhamento)
        // O frontend (useRegisterPush.ts) deve enviar o token anónimo do tutor
        else if (!empty($validated['tutor_token'])) {
            $notifiableTutor = Tutor::where('anonymous_edit_token', $validated['tutor_token'])->first();
        }

        // Se não encontrou nem logado nem anónimo, falha.
        if (!$notifiableTutor) {
            Log::warning('Push subscription failed: No valid user or tutor token provided.', ['endpoint' => $validated['endpoint']]);
            return response()->json(['message' => 'Não foi possível identificar o subscritor.'], 404);
        }

        // ✅ === INÍCIO DA CORREÇÃO 2 ===
        // Usamos updateOrCreate para evitar duplicados e lidar com atualizações.
        // Isto salva na tabela 'push_subscriptions' (polimórfica)
        $notifiableTutor->pushSubscriptions()->updateOrCreate(
            ['endpoint' => $validated['endpoint']],
            [
                'public_key' => $validated['public_key'] ?? null,
                'auth_token' => $validated['auth_token'] ?? null,
            ]
        );
        // ✅ === FIM DA CORREÇÃO 2 ===
        
        // A sua lógica antiga de salvar na coluna 'push_subscription' 
        // foi substituída pelo 'updateOrCreate' acima, que é mais robusto
        // e usa a tabela correta.

        return response()->json(['message' => 'Subscription salva com sucesso.']);
    }

    /**
     * Envia uma notificação Web Push para todos os usuários com subscription válida.
     * Remove automaticamente as que falharem.
     * * [NOTA: Este método 'send' não é usado pelo fluxo de emergência,
     * mas é mantido como estava, pois ele procura em 'usuarios']
     */
    public function send(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'body' => 'required|string',
            'url' => 'nullable|string',
        ]);

        $payload = json_encode([
            'title' => $request->title,
            'body' => $request->body,
            'url' => $request->url ?? '/',
        ]);

        // Busca todos os usuários com subscription salva (Lógica antiga mantida)
        $users = Usuario::whereNotNull('push_subscription')->get();

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('app.url'),
                'publicKey' => config('webpush.vapid.public_key'),
                'privateKey' => config('webpush.vapid.private_key'),
            ],
        ]);

        $invalidCount = 0;
        $successCount = 0;

        foreach ($users as $user) {
            try {
                // Tenta enviar para a subscrição do *Usuário*
                $subscription = Subscription::create($user->push_subscription);
                $report = $webPush->sendOneNotification($subscription, $payload);

                if ($report->isSuccess()) {
                    $successCount++;
                } else {
                    $statusCode = $report->getResponse()?->getStatusCode();

                    // 404 ou 410 → Subscription inválida → remover
                    if (in_array($statusCode, [404, 410])) {
                        $user->push_subscription = null;
                        $user->save();
                        $invalidCount++;
                        Log::warning("Subscription inválida removida para o usuário {$user->id}");
                    } else {
                        Log::error("Erro enviando push para {$user->id}: " . $report->getReason());
                    }
                }
            } catch (\Exception $e) {
                Log::error("Exceção WebPush para {$user->id}: " . $e->getMessage());
            }
        }
        
        // [LÓGICA ADICIONADA PARA TUTORES ANÓNIMOS]
        // (Se você quiser que este método 'send' genérico também funcione para eles)
        $tutors = Tutor::whereNull('usuario_id')->whereNotNull('push_subscription')->get();
        foreach ($tutors as $tutor) {
             try {
                // Tenta enviar para a subscrição do *Tutor*
                $subscription = Subscription::create($tutor->push_subscription);
                $report = $webPush->sendOneNotification($subscription, $payload);

                if ($report->isSuccess()) {
                    $successCount++;
                } else {
                    $statusCode = $report->getResponse()?->getStatusCode();
                    if (in_array($statusCode, [404, 410])) {
                        $tutor->push_subscription = null;
                        $tutor->save();
                        $invalidCount++;
                        Log::warning("Subscription inválida removida para o tutor {$tutor->id}");
                    } else {
                        Log::error("Erro enviando push para {$tutor->id}: " . $report->getReason());
                    }
                }
            } catch (\Exception $e) {
                Log::error("Exceção WebPush para {$tutor->id}: " . $e->getMessage());
            }
        }

        return response()->json([
            'success' => $successCount,
            'removed_invalid' => $invalidCount,
            'message' => "Notificações enviadas: {$successCount}, removidas inválidas: {$invalidCount}",
        ]);
    }
}