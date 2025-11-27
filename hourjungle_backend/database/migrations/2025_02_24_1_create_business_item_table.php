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
        Schema::create('business_items', function (Blueprint $table) {
            $table->id();
            $table->integer('number')->unique()->comment('業務項目編號');
            $table->string('name')->comment('業務項目名稱');
            $table->decimal('price', 10, 2)->default(0)->comment('定價');
            $table->decimal('deposit', 10, 2)->default(0)->comment('押金');
            $table->tinyInteger('status')->default(1)->comment('狀態 1:啟用 0:停用');
            $table->text('remarks')->nullable()->comment('備註');
            $table->timestamps();
            $table->softDeletes();

            // 管別關聯
            $table->unsignedBigInteger('branch_id')->nullable();
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
        Schema::dropIfExists('business_items');

        Schema::table('business_items', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};