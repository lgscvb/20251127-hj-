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
        //繳費歷程
        Schema::create('payment_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->comment('合約ID');
            $table->foreignId('customer_id')->comment('客戶ID');
            $table->foreignId('branch_id')->comment('管別ID');
            $table->date('pay_day')->comment('付款日期');
            $table->string('pay_type')->comment('付款方式');
            $table->decimal('amount', 10, 2)->comment('付款金額');
            $table->text('remark')->nullable()->comment('備註');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_histories');

        Schema::table('payment_histories', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};