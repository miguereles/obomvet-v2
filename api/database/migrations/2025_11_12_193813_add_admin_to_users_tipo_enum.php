<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Usa o Schema Builder do Laravel em vez de DB::statement
        // O Doctrine (dbal) irá traduzir isto para o SQLite
        Schema::table('usuarios', function (Blueprint $table) {
            // A sintaxe "change()" diz ao Laravel para modificar a coluna
            $table->string('tipo')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            // Reverte para a definição anterior se dermos rollback
            $table->string('tipo')->change();
        });
    }
};
