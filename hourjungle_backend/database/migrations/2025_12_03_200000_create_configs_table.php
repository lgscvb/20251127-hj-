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
        Schema::create('configs', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique()->comment('設定鍵');
            $table->text('value')->nullable()->comment('設定值');
            $table->string('description')->nullable()->comment('說明');
            $table->timestamps();
        });

        // 插入預設設定
        $configs = [
            ['key' => 'overdue_days', 'value' => '7', 'description' => '逾期通知天數'],
            ['key' => 'penalty_fee', 'value' => '1000', 'description' => '違約金'],
            ['key' => 'late_fee', 'value' => '5', 'description' => '滯納金(%)'],
            ['key' => 'hash_key', 'value' => '', 'description' => 'HashKey'],
            ['key' => 'hash_iv', 'value' => '', 'description' => 'HashIV'],
            ['key' => 'validate', 'value' => '', 'description' => 'Validate'],
            ['key' => 'callback_url', 'value' => '', 'description' => 'Callback URL'],
            ['key' => 'line_webhook_url', 'value' => '', 'description' => 'LINE Webhook URL'],
        ];

        foreach ($configs as $config) {
            DB::table('configs')->insert([
                'key' => $config['key'],
                'value' => $config['value'],
                'description' => $config['description'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configs');
    }
};
