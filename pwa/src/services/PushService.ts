import api from './api';

const PushService = {

  /**
   * Salva a assinatura de Push no backend.
   * Rota: POST /save-subscription (de routes/api.php, apontando para PushController@store)
   */
  subscribe: async (
    subscription: PushSubscriptionJSON, 
    anonymousTutorToken: string | null // [PARÂMETRO ADICIONADO]
  ): Promise<void> => {
    
    const payload = {
      endpoint: subscription.endpoint,
      keys: {
        auth: subscription.keys?.auth,
        p256dh: subscription.keys?.p256dh,
      },
      // [LINHA ADICIONADA]
      // Envia o token anónimo se existir. O PushController (backend)
      // usará isto para encontrar o Tutor anónimo.
      tutor_token: anonymousTutorToken, 
    };
    
    // [ROTA CORRIGIDA]
    // O seu 'routes/api.php' (arquivo que você carregou) 
    // define a rota PÚBLICA 'POST /save-subscription' para o método 'store'
    // do PushController. Vamos usar essa rota.
    // O seu arquivo anterior chamava '/push/subscribe', que estava protegido.
    await api.post('/save-subscription', payload);
  }
};

export default PushService;