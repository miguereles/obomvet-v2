<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tutors', function (Blueprint $table) {
    $table->id();
    $table->foreignId('usuario_id')->nullable()->constrained('usuarios'); // <-- Corrigido
    $table->string('nome_completo');
    $table->string('telefone_principal');
    $table->string('telefone_alternativo')->nullable();
    $table->string('cpf')->nullable()->unique(); // <-- Corrigido
    $table->string('email_contato')->nullable(); // <-- Adicionado aqui
    // ... tokens anónimos se os tiver aqui ...
    $table->timestamps();
});
    }

    public function down()
    {
        Schema::dropIfExists('tutors');
    }
};