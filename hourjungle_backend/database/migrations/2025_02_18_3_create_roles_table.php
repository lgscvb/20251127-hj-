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
        //角色
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable(); // 顯示名稱，如：管理員、編輯者、一般用戶
            $table->tinyInteger('status')->default(1); // 角色狀態：1=啟用，0=禁用
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');

        Schema::table('roles', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
