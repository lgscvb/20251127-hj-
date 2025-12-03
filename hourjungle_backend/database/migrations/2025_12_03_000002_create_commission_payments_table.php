<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 佣金記錄資料表
     */
    public function up(): void
    {
        Schema::create('commission_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('accounting_firm_id')->nullable()->comment('會計事務所 ID');
            $table->unsignedBigInteger('customer_id')->nullable()->comment('客戶 ID');
            $table->unsignedBigInteger('project_id')->nullable()->comment('合約 ID');
            $table->string('customer_name', 100)->nullable()->comment('客戶名稱（冗餘）');
            $table->string('referrer_name', 100)->nullable()->comment('介紹人名稱');
            $table->date('contract_start')->nullable()->comment('合約開始日期');
            $table->date('eligible_date')->nullable()->comment('佣金資格日期（簽約滿6個月）');
            $table->decimal('commission_amount', 10, 2)->default(0)->comment('佣金金額');
            $table->enum('status', ['pending', 'eligible', 'paid', 'cancelled'])->default('pending')->comment('狀態');
            $table->date('paid_at')->nullable()->comment('付款日期');
            $table->string('payment_method', 50)->nullable()->comment('付款方式');
            $table->text('remark')->nullable()->comment('備註');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('accounting_firm_id')
                ->references('id')
                ->on('accounting_firms')
                ->onDelete('set null');

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('set null');

            $table->foreign('project_id')
                ->references('id')
                ->on('projects')
                ->onDelete('set null');

            $table->index('status');
            $table->index('paid_at');
            $table->index('referrer_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commission_payments');
    }
};
