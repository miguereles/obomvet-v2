<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Esta migration adiciona as colunas 'relatorio_detalhado_ia' e 'materiais_provaveis'
 * à tabela 'emergencias', que estavam em falta e a causar o erro 500.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Verifica se a tabela 'emergencias' existe antes de tentar alterá-la
        if (Schema::hasTable('emergencias')) {
            Schema::table('emergencias', function (Blueprint $table) {
                
                // Adiciona a coluna 'relatorio_detalhado_ia' se ela não existir
                if (!Schema::hasColumn('emergencias', 'relatorio_detalhado_ia')) {
                    // Coloca-a depois da 'descricao_sintomas' para organização
                    $table->text('relatorio_detalhado_ia')->nullable()->after('descricao_sintomas');
                }

                // Adiciona a coluna 'materiais_provaveis' se ela não existir
                if (!Schema::hasColumn('emergencias', 'materiais_provaveis')) {
                    // Coloca-a depois da nova coluna 'relatorio_detalhado_ia'
                    $table->text('materiais_provaveis')->nullable()->after('relatorio_detalhado_ia');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('emergencias')) {
            Schema::table('emergencias', function (Blueprint $table) {
                // Remove as colunas se existirem
                if (Schema::hasColumn('emergencias', 'relatorio_detalhado_ia')) {
                    $table->dropColumn('relatorio_detalhado_ia');
                }
                if (Schema::hasColumn('emergencias', 'materiais_provaveis')) {
                    $table->dropColumn('materiais_provaveis');
                }
            });
        }
    }
};