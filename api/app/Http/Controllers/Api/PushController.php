<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use App\Models\Usuario;
use Illuminate\Support\Facades\Log;

class PushController extends Controller
{
    /**
     * Salva a assinatura Web Push do usuário autenticado.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'endpoint' => 'required|string',
            'keys' => 'required|array',
            'keys.auth' => 'required|string',
            'keys.p256dh' => 'required|string',
        ]);

        $user->push_subscription = $validated;
        $user->save();

        return response()->json(['message' => 'Subscription salva com sucesso.']);
    }

    /**
     * Envia uma notificação Web Push para todos os usuários com subscription válida.
     * Remove automaticamente as que falharem.
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

        // Busca todos os usuários com subscription salva
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

        return response()->json([
            'success' => $successCount,
            'removed_invalid' => $invalidCount,
            'message' => "Notificações enviadas: {$successCount}, removidas inválidas: {$invalidCount}",
        ]);
    }
}