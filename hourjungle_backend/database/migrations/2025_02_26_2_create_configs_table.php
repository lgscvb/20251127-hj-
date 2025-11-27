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
        Schema::create('config', function (Blueprint $table) {
            $table->id();
            $table->integer('overdue_days')->default(0)->comment('逾期天數');
            $table->decimal('penalty_fee', 10, 2)->default(0)->comment('違約金');
            $table->string('late_fee')->default(0)->comment('滯納金(%)');
            $table->string('hash_key')->nullable()->comment('HashKey');
            $table->string('hash_iv')->nullable()->comment('HashIV');
            $table->string('validate')->nullable()->comment('Validate');
            $table->string('callback_url')->nullable()->comment('支付回調地址');
            $table->string('line_webhook_url')->nullable()->comment('LINE Webhook URL');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configs');
    }
};
