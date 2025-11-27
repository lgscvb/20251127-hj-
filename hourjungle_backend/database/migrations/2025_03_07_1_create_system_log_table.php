<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('system_logs', function (Blueprint $table) {
            $table->id();
            $table->string('member_id');
            $table->string('action');
            $table->text('description');
            $table->string('sql_table');
            $table->string('sql_data_id');
            $table->string('sql_action');
            $table->timestamps();

            $table->index('member_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('system_logs');
    }
};