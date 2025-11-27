<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddContractAndSignatureFieldsToProjectsTable extends Migration
{
    public function up()
    {
        Schema::table('projects', function (Blueprint $table) {
            // 先檢查欄位是否存在
            if (!Schema::hasColumn('projects', 'contract_path')) {
                $table->string('contract_path')->nullable()->after('contract_status');
            }
            if (!Schema::hasColumn('projects', 'signature_path')) {
                $table->string('signature_path')->nullable()->after('contract_path');
            }
            if (!Schema::hasColumn('projects', 'confirmed_at')) {
                $table->timestamp('confirmed_at')->nullable()->after('signature_path');
            }
            if (!Schema::hasColumn('projects', 'confirmed_by')) {
                $table->unsignedBigInteger('confirmed_by')->nullable()->after('confirmed_at');
                $table->foreign('confirmed_by')->references('id')->on('members');
            }
        });
    }

    public function down()
    {
        Schema::table('projects', function (Blueprint $table) {
            // 先檢查外鍵是否存在
            if (Schema::hasColumn('projects', 'confirmed_by')) {
                $table->dropForeign(['confirmed_by']);
            }
            
            // 再刪除欄位
            $table->dropColumn(['contract_path', 'signature_path', 'confirmed_at', 'confirmed_by']);
        });
    }
} 