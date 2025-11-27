<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('line_messages', function (Blueprint $table) {
            $table->id();
            $table->string('message_id')->nullable();
            $table->string('user_id');
            $table->string('reply_token')->nullable();
            $table->string('message_type');
            $table->text('message_text')->nullable();
            $table->text('reply_text')->nullable();
            $table->json('raw_data')->nullable();
            $table->boolean('is_processed')->default(false);
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('message_id');
        });

        Schema::create('line_users', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->unique();
            $table->string('display_name')->nullable();
            $table->string('picture_url')->nullable();
            $table->string('status_message')->nullable();
            $table->json('user_data')->nullable();
            $table->timestamp('last_interaction')->nullable();
            $table->timestamps();
            
            $table->index('user_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('line_messages');
        Schema::dropIfExists('line_users');
    }
};