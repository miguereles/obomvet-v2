import api from './api';

const PushService = {

  /**
   * Salva a assinatura de Push no backend.
   * Rota: POST /push/subscribe (de routes/api.php)
   */
  subscribe: async (subscription: PushSubscriptionJSON): Promise<void> => {
    // A rota no seu routes/api.php é complexa, ela espera os dados soltos.
    // O PushController.php espera 'endpoint', 'keys.auth', 'keys.p256dh'.
    // Vamos adaptar a subscrição para esse formato.
    const payload = {
      endpoint: subscription.endpoint,
      keys: {
        auth: subscription.keys?.auth,
        p256dh: subscription.keys?.p256dh,
      }
    };
    
    // Seu routes/api.php usa /push/subscribe, mas o PushController é /save-subscription
    // Vou usar /save-subscription (do PushController.php)
    // ADICIONE EM routes/api.php: Route::post('/push/save', [PushController::class, 'store']);
    
    // Seu useRegisterPush.js usa /push/subscribe, mas o Controller é 'store'
    // E o routes/api.php tem '/save-subscription' (PÚBLICO)
    // E uma rota '/push/subscribe' (PROTEGIDA) que faz algo complexo.
    // O seu PushController.php (store) é o correto.
    // Vamos usar a rota PÚBLICA /save-subscription que você definiu
    
    // CORREÇÃO: O PushController.php (store) é o que você quer.
    // A rota para ele em routes/api.php é PÚBLICA: /save-subscription
    
    // RE-CORREÇÃO: O PushController.php (store) usa $request->user(),
    // então ele DEVE ser uma rota protegida.
    // Vamos criar uma rota para ele.
    // ADICIONE EM routes/api.php (dentro do middleware 'auth:api'):
    // Route::post('/push/subscribe', [PushController::class, 'store']);
    
    await api.post('/push/subscribe', payload);
  }
};

export default PushService;