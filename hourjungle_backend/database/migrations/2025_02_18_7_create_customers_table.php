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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            
            // 基本個人資料
            $table->string('number', 50)->nullable();              // 客戶編號
            $table->string('name', 50)->nullable();               // 客戶姓名
            $table->string('id_number', 50)->nullable();          // 身分證字號
            $table->date('birthday')->nullable();                 // 生日
            $table->string('email', 100)->nullable();             // 電子郵件
            $table->string('phone', 20)->nullable();              // 電話號碼
            $table->string('address')->nullable();                // 地址
            
            // 公司相關資料
            $table->string('company_name', 200)->nullable();      // 公司名稱
            $table->string('company_number', 20)->nullable();     // 公司統一編號
            $table->string('company_website', 100)->nullable();   // 公司網站
            $table->string('company_email', 100)->nullable();     // 公司電子郵件
            $table->string('company_address', 100)->nullable();   // 公司地址
            $table->string('company_phone_number', 20)->nullable();    // 公司電話號碼
            $table->string('company_fax_number', 20)->nullable();      // 公司傳真號碼
            
            // 聯絡人資料
            $table->string('company_contact_person', 100)->nullable();  // 公司聯絡人
            $table->string('company_contact_person_phone_number', 20)->nullable(); // 聯絡人電話
            $table->string('company_contact_person_email', 100)->nullable();       // 聯絡人郵件
            
            // 社群媒體資料
            $table->string('line_id', 100)->nullable();          // LINE ID
            $table->string('line_nickname', 100)->nullable();    // LINE 暱稱
            
            // 證件資料
            $table->string('id_card_front', 100)->nullable();    // 身分證正面
            $table->string('id_card_back', 100)->nullable();     // 身分證背面
            
            // 系統欄位
            $table->longText('remark')->nullable();              // 備註
            $table->tinyInteger('status')->default(1);          // 狀態 1:啟用 0:停用
            $table->tinyInteger('modify')->default(1);          // 前端編輯權限 1:啟用 0:停用
            $table->timestamps();                               // created_at 和 updated_at
            $table->softDeletes();
            // 管別關聯
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('branch_name')->nullable();

            $table->foreign('branch_id')
                ->references('id')
                ->on('branches')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');

        Schema::table('customers', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
