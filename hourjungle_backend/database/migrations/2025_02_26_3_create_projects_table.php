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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('projectName')->comment('合約名稱');
            $table->foreignId('business_item_id')->comment('業務項目ID');
            $table->foreignId('customer_id')->comment('客戶ID');
            $table->foreignId('member_id')->comment('會員ID');
            $table->foreignId('branch_id')->comment('管別ID');
            $table->date('start_day')->comment('開始日期');
            $table->date('end_day')->comment('結束日期');
            $table->date('signing_day')->comment('簽約日期');
            $table->tinyInteger('pay_day')->comment('付款日期');
            $table->tinyInteger('payment_period')->comment('付款方案');
            $table->string('contractType')->comment('合約類型 幾年約');
            $table->decimal('original_price', 10, 2)->comment('原價');
            $table->decimal('sale_price', 10, 2)->default(0)->comment('售價');
            $table->decimal('current_payment', 10, 2)->default(0)->comment('每期應繳');
            $table->decimal('total_payment', 10, 2)->default(0)->comment('合約總金額');
            $table->decimal('penaltyFee', 10, 2)->default(0)->comment('違約金');
            $table->decimal('lateFee', 10, 2)->default(3)->comment('滯納金比例');
            $table->decimal('deposit', 10, 2)->default(0)->comment('押金');
            $table->date('next_pay_day')->nullable()->comment('下次付款日期');
            $table->date('last_pay_day')->nullable()->comment('最後付款日期');
            $table->tinyInteger('status')->default(1)->comment('狀態');
            $table->tinyInteger('contract_status')->default(0)->comment('合約用印狀態，0:未提交、1:審核中、2:已審核、3:未通過');
            $table->string('broker', 50)->nullable()->comment('介紹人');
            $table->text('broker_remark')->nullable()->comment('介紹人備註');
            $table->text('remark')->nullable()->comment('備註');
            $table->string('contract_path')->nullable()->comment('合約路徑');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');

        Schema::table('projects', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};