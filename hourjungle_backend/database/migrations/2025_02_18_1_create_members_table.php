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
        //登入後台的帳號
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('account')->unique();  // 登入帳號
            $table->string('nickname');  // 暱稱
            $table->string('password');  // 密碼
            $table->string('token')->nullable();  // token
            $table->string('email')->nullable();  // 電子郵件
            $table->string('phone')->nullable();  // 電話
            $table->tinyInteger('is_top_account')->default(0);  // 是否為頂級帳號 1:是 0:否
            $table->unsignedBigInteger('role_id')->nullable();  // 新增: 角色ID
            $table->string('branch_id')->nullable();  // 所在場館
            $table->tinyInteger('status')->default(1);  // 用戶狀態 1:啟用 0:停用
            $table->dateTime('last_login')->nullable();  // 最後登入時間
            $table->dateTime('created_at')->nullable();
            $table->dateTime('updated_at')->nullable();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
        Schema::table('members', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
}; 