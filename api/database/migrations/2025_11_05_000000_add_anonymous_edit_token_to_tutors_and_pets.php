<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAnonymousEditTokenToTutorsAndPets extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('tutors', function (Blueprint $table) {
            $table->string('anonymous_edit_token', 64)->nullable()->after('telefone_principal');
            $table->timestamp('anonymous_edit_token_expires_at')->nullable()->after('anonymous_edit_token');
        });

        Schema::table('pets', function (Blueprint $table) {
            $table->string('anonymous_edit_token', 64)->nullable()->after('tutor_id');
            $table->timestamp('anonymous_edit_token_expires_at')->nullable()->after('anonymous_edit_token');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('tutors', function (Blueprint $table) {
            $table->dropColumn(['anonymous_edit_token', 'anonymous_edit_token_expires_at']);
        });

        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn(['anonymous_edit_token', 'anonymous_edit_token_expires_at']);
        });
    }
}
