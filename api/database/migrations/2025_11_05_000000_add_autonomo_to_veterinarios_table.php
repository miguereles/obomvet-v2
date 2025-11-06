<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('veterinarios', function (Blueprint $table) {
            $table->boolean('autonomo')->default(false);
            $table->json('area_atuacao')->nullable(); // Para veterinários autônomos definirem sua área de cobertura
            $table->string('endereco')->nullable();
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
        });
    }

    public function down()
    {
        Schema::table('veterinarios', function (Blueprint $table) {
            $table->dropColumn(['autonomo', 'area_atuacao', 'endereco', 'lat', 'lng']);
        });
    }
};