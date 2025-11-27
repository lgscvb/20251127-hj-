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
        //權限項目
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('category')->nullable(); // 如：顧客列表、合約列表等
            $table->string('name')->nullable(); // 顯示名稱，如：新增、編輯、刪除
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permissions');

        Schema::table('permissions', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
