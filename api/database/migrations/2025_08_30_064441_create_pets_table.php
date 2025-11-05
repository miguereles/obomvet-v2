<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('especie');
            $table->string('raca')->nullable();
            $table->date('data_nascimento')->nullable();
            $table->decimal('peso', 5, 2)->nullable();
            $table->text('alergias')->nullable();
            $table->text('medicamentos_continuos')->nullable();
            $table->text('cuidados_especiais')->nullable();
            $table->foreignId('tutor_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('pets');
    }
};