<?php

namespace Database\Seeders;

use App\Models\Usuario;
use App\Models\Clinica;
use App\Models\Tutor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Criar Utilizador Administrador
        //    (Não precisa de perfil, 'tipo' = 'admin' é suficiente)
        Usuario::firstOrCreate(
            ['email' => 'admin@obomvet.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'), // Senha: password
                'tipo' => 'admin',
            ]
        );

        // 2. Criar Utilizador Clínica (com perfil de clínica associado)
        $usuarioClinica = Usuario::firstOrCreate(
            ['email' => 'clinica@obomvet.com'],
            [
                'name' => 'Clinica Vet de Teste',
                'password' => Hash::make('password'), // Senha: password
                'tipo' => 'clinica',
            ]
        );

        // Associa o perfil da clínica ao utilizador
        if ($usuarioClinica->wasRecentlyCreated) {
            Clinica::create([
                'usuario_id' => $usuarioClinica->id,
                'nome_fantasia' => 'Clinica Vet de Teste',
                'email_contato' => 'clinica@obomvet.com',
                'telefone_principal' => '(99) 99999-9999',
                // Adicione outros campos obrigatórios de 'clinicas' aqui
            ]);
        }

        // 3. Criar Utilizador Tutor (com perfil de tutor associado)
        $usuarioTutor = Usuario::firstOrCreate(
            ['email' => 'tutor@obomvet.com'],
            [
                'name' => 'Tutor de Teste',
                
                'password' => Hash::make('password'), // Senha: password
                'tipo' => 'tutor',
            ]
        );

        // Associa o perfil do tutor ao utilizador
        if ($usuarioTutor->wasRecentlyCreated) {
            Tutor::create([
                'usuario_id' => $usuarioTutor->id,
                'nome_completo' => 'Tutor de Teste',
                'email_contato' => 'tutor@obomvet.com',
                'telefone_principal' => '(88) 88888-8888',
                // Adicione outros campos obrigatórios de 'tutors' aqui
            ]);
        }
    }
}