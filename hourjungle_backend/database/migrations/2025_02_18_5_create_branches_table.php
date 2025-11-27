<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBranchesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('場館名稱');
            $table->string('address')->nullable()->comment('場館地址');
            $table->string('phone')->nullable()->comment('場館電話');
            $table->string('email')->nullable()->comment('場館電子郵件');
            $table->string('website')->nullable()->comment('場館網站');
            $table->string('logo')->nullable()->comment('場館logo');
            $table->string('manager')->nullable()->comment('場館負責人');
            $table->string('manager_phone')->nullable()->comment('場館負責人電話');
            $table->string('manager_email')->nullable()->comment('場館負責人電子郵件');
            $table->string('description')->nullable()->comment('場館描述');
            $table->tinyInteger('status')->default(1)->comment('狀態 1:啟用 0:停用');
            $table->text('remarks')->nullable()->comment('備註');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('branches');

        Schema::table('branches', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
}