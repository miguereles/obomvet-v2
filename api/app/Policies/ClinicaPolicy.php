<?php

namespace App\Policies;

use App\Models\Clinica;
use App\Models\Usuario;

class ClinicaPolicy
{
    public function viewAny(Usuario $user): bool
    {
        return true;
    }

    public function view(Usuario $user, Clinica $clinica): bool
    {
        return true;
    }

    public function create(Usuario $user): bool
    {
        return true;
    }

    public function update(Usuario $user, Clinica $clinica): bool
    {
        // Apenas o usuário vinculado à clínica pode atualizar os dados da clínica
        return isset($user->clinica) && $user->clinica->id === $clinica->id;
    }

    public function delete(Usuario $user, Clinica $clinica): bool
    {
        // Apenas o usuário vinculado à clínica pode deletar a clínica
        return isset($user->clinica) && $user->clinica->id === $clinica->id;
    }
}