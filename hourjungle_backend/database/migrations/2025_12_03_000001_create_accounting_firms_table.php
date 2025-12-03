<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 會計事務所資料表
     */
    public function up(): void
    {
        Schema::create('accounting_firms', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200)->comment('事務所名稱');
            $table->string('short_name', 50)->nullable()->comment('簡稱/介紹人名稱');
            $table->string('contact_person', 100)->nullable()->comment('聯絡人');
            $table->string('phone', 20)->nullable()->comment('電話');
            $table->string('email', 100)->nullable()->comment('電子郵件');
            $table->string('address')->nullable()->comment('地址');
            $table->string('tax_id', 8)->nullable()->comment('統一編號');
            $table->decimal('commission_rate', 5, 2)->default(100.00)->comment('佣金比例（%）');
            $table->text('remark')->nullable()->comment('備註');
            $table->tinyInteger('status')->default(1)->comment('狀態 1:啟用 0:停用');
            $table->timestamps();
            $table->softDeletes();

            $table->index('short_name');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounting_firms');
    }
};
