<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Paths
    |--------------------------------------------------------------------------
    |
    | Defina aqui as rotas da API que devem permitir requisições CORS.
    | Pode usar coringas como 'api/*' para todas as rotas de API.
    |
    */
    'paths' => [
        'api/*',
        'broadcasting/auth',
        'sanctum/csrf-cookie',
        'push/*',
        'save-subscription', 
        'send-push'
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Methods
    |--------------------------------------------------------------------------
    |
    | Os métodos HTTP permitidos para CORS. Use ['*'] para permitir todos.
    |
    */
    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    |
    | Os domínios que podem fazer requisições. No desenvolvimento, 
    | use 'http://localhost:3000' (ou a porta do seu PWA).
    | Em produção, liste apenas o domínio do front-end.
    |
    */
    'allowed_origins' => ['http://localhost:5173',
                         'http://localhost:5173',
                         'https://localhost:8000',
                         'https://localhost:8000'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins Patterns
    |--------------------------------------------------------------------------
    |
    | Use expressões regulares para permitir origens dinâmicas.
    |
    */
    'allowed_origins_patterns' => [],

    /*
    |--------------------------------------------------------------------------
    | Allowed Headers
    |--------------------------------------------------------------------------
    |
    | Cabeçalhos permitidos na requisição. Use ['*'] para todos.
    |
    */
'allowed_headers' => [
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With', 
    ],
    /*
    |--------------------------------------------------------------------------
    | Exposed Headers
    |--------------------------------------------------------------------------
    |
    | Cabeçalhos que podem ser expostos para o cliente.
    |
    */
    'exposed_headers' => ['Authorization', 'Content-Type', 'X-Requested-With'],

    /*
    |--------------------------------------------------------------------------
    | Max Age
    |--------------------------------------------------------------------------
    |
    | Tempo em segundos que os resultados do preflight podem ser cacheados.
    |
    */
    'max_age' => 3600,

    /*
    |--------------------------------------------------------------------------
    | Supports Credentials
    |--------------------------------------------------------------------------
    |
    | Se true, permite cookies e tokens de autenticação serem enviados.
    | Se usar JWT via header, também pode ficar como true.
    |
    */
    'supports_credentials' => true,

];