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
        Schema::table('tutors', function (Blueprint $table) {
            // Adiciona a coluna de subscrição de push diretamente ao tutor
            // para suportar tutores anónimos (que não têm Usuário).
            $table->json('push_subscription')->nullable()->after('anonymous_edit_token_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tutors', function (Blueprint $table) {
            $table->dropColumn('push_subscription');
        });
    }
};