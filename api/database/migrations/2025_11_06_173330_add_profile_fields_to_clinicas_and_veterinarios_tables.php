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
        Schema::table('clinicas', function (Blueprint $table) {
            $table->string('descricao', 255)->nullable()->after('publica');
            $table->string('foto_url')->nullable()->after('descricao');
        });
        
        Schema::table('veterinarios', function (Blueprint $table) {
            $table->string('descricao', 500)->nullable()->after('lng');
            $table->string('foto_url')->nullable()->after('descricao');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clinicas', function (Blueprint $table) {
            $table->dropColumn(['descricao', 'foto_url']);
        });

        Schema::table('veterinarios', function (Blueprint $table) {
            $table->dropColumn(['descricao', 'foto_url']);
        });
    }
};