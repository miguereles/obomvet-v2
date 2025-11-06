<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
// 1. ADICIONE ESTA LINHA (para importar o pacote de WebPush)
use NotificationChannels\WebPush\HasPushSubscriptions;

class Usuario extends Authenticatable implements JWTSubject
{
    // 2. ADICIONE O TRAIT AQUI (junto ao Notifiable)
    use Notifiable, HasPushSubscriptions;

    protected $fillable = [
        'name',
        'nome_completo',
        'email',
        'password',
        'tipo',
        'cpf',
        'cnpj',
        'nome_fantasia',
        'razao_social',
        'endereco',
        'telefone_principal',
        'telefone_alternativo',
    ];


    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function tutor()
    {
        return $this->hasOne(Tutor::class);
    }

    public function veterinario()
    {
        return $this->hasOne(Veterinario::class);
    }
    public function clinica()
    {
        return $this->hasOne(Clinica::class);
    }

    public function isTutor()
    {
        return $this->tipo === 'tutor';
    }
    public function fotoPerfil()
    {
        return $this->morphOne(Anexo::class, 'anexable');
    }
    public function isVeterinario()
    {
        return $this->tipo === 'veterinario';
    }
    public function isClinica()
    {
        return $this->tipo === 'clinica';
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }
}