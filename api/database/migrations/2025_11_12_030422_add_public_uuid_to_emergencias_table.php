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
        Schema::table('emergencias', function (Blueprint $table) {
            // Adiciona a coluna UUID pública, que será usada para
            // o canal de broadcast anónimo.
            // É nullable() para ser compatível com registos antigos.
            // É unique() para garantir que cada link de partilha é único.
            $table->uuid('public_uuid')->nullable()->unique()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('emergencias', function (Blueprint $table) {
            $table->dropColumn('public_uuid');
        });
    }
};