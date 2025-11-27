<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPaymentAndDatesToProjectsTable extends Migration
{
    public function up()
    {
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'current_payment')) {
                $table->decimal('current_payment', 10, 2)->default(0)->after('sale_price');
            }
            if (!Schema::hasColumn('projects', 'total_payment')) {
                $table->decimal('total_payment', 10, 2)->default(0)->after('current_payment');
            }
            if (!Schema::hasColumn('projects', 'next_pay_day')) {
                $table->date('next_pay_day')->nullable()->after('total_payment');
            }
            if (!Schema::hasColumn('projects', 'last_pay_day')) {
                $table->date('last_pay_day')->nullable()->after('next_pay_day');
            }
        });
    }

    public function down()
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('current_payment');
            $table->dropColumn('total_payment');
            $table->dropColumn('next_pay_day');
            $table->dropColumn('last_pay_day');
        });
    }
} 