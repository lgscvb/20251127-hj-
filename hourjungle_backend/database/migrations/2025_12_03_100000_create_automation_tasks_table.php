<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 自動化任務資料表（繳費/續約提醒）
     */
    public function up(): void
    {
        Schema::create('automation_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_type', 50)->comment('任務類型: payment_reminder, renewal_reminder');
            $table->unsignedBigInteger('customer_id')->nullable()->comment('客戶 ID');
            $table->unsignedBigInteger('project_id')->nullable()->comment('合約 ID');
            $table->timestamp('scheduled_at')->comment('排程執行時間');
            $table->timestamp('executed_at')->nullable()->comment('實際執行時間');
            $table->enum('status', ['pending', 'executed', 'failed', 'cancelled'])->default('pending')->comment('狀態');
            $table->string('channel', 20)->default('line')->comment('通知管道: line, email, sms');
            $table->json('payload')->nullable()->comment('任務資料（訊息內容等）');
            $table->text('result')->nullable()->comment('執行結果');
            $table->integer('retry_count')->default(0)->comment('重試次數');
            $table->timestamps();
            $table->softDeletes();

            // 索引
            $table->index('task_type');
            $table->index('status');
            $table->index('scheduled_at');
            $table->index(['customer_id', 'project_id']);

            // 外鍵
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('set null');

            $table->foreign('project_id')
                ->references('id')
                ->on('projects')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('automation_tasks');
    }
};
