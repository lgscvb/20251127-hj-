<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddContractStatusToProjectsTable extends Migration
{
    public function up()
    {
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'contract_status')) {
                $table->tinyInteger('contract_status')->default(0)->after('status')
                    ->comment('合約狀態：0=未提交，1=已提交，2=已審核');
            }
        });
    }

    public function down()
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'contract_status')) {
                $table->dropColumn('contract_status');
            }
        });
    }
} 