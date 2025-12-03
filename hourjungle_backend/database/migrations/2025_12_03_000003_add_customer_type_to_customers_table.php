<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 新增客戶類型欄位（個人、行號、公司）
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->enum('customer_type', ['individual', 'sole_proprietorship', 'company'])
                ->default('individual')
                ->after('company_fax_number')
                ->comment('客戶類型：individual=個人, sole_proprietorship=行號, company=公司');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('customer_type');
        });
    }
};
