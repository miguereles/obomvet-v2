<?php

namespace App\Providers;

use App\Models\Anexo;
use App\Models\Clinica;
use App\Models\Emergencia;
use App\Models\HistoricoAtendimento;
use App\Models\Pet;
use App\Models\Prontuario;
use App\Models\Tutor;
use App\Models\Veterinario;
use App\Models\Usuario;
use App\Policies\AnexoPolicy;
use App\Policies\ClinicaPolicy;
use App\Policies\EmergenciaPolicy;
use App\Policies\HistoricoAtendimentoPolicy;
use App\Policies\PetPolicy;
use App\Policies\ProntuarioPolicy;
use App\Policies\TutorPolicy;
use App\Policies\VeterinarioPolicy;
use App\Policies\UsuarioPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate; // ✅ [CORREÇÃO 1] Importa o Gate

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Anexo::class => AnexoPolicy::class,
        Clinica::class => ClinicaPolicy::class,
        Emergencia::class => EmergenciaPolicy::class,
        HistoricoAtendimento::class => HistoricoAtendimentoPolicy::class,
        Pet::class => PetPolicy::class,
        Prontuario::class => ProntuarioPolicy::class,
        Tutor::class => TutorPolicy::class,
        Usuario::class => UsuarioPolicy::class,
        Veterinario::class => VeterinarioPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // ✅ [CORREÇÃO 2] Adiciona a regra de "Super Admin"
        // Isto é executado ANTES de qualquer outra Policy.
        // Se o utilizador for 'admin', ele tem permissão total.
        Gate::before(function (Usuario $user, $ability) {
            if ($user->tipo === 'admin') {
                return true;
            }

            // Retorna null para deixar as outras Policies decidirem
            return null; 
        });
    }
}