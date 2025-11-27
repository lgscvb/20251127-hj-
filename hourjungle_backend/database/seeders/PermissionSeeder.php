<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        $permissions = [
            ['category' => '顧客列表', 'name' => '新增顧客'],
            ['category' => '顧客列表', 'name' => '查看顧客'],
            ['category' => '顧客列表', 'name' => '編輯顧客'],
            ['category' => '顧客列表', 'name' => '刪除顧客'],
            ['category' => '顧客列表', 'name' => '顧客異動紀錄'],
            ['category' => '顧客列表', 'name' => '顧客資料匯入'],
            ['category' => '顧客列表', 'name' => '顧客資料匯出'],

            ['category' => '業務項目', 'name' => '新增業務項目'],
            ['category' => '業務項目', 'name' => '查看業務項目'],
            ['category' => '業務項目', 'name' => '編輯業務項目'],
            ['category' => '業務項目', 'name' => '刪除業務項目'],
            ['category' => '業務項目', 'name' => '業務項目異動紀錄'],
            ['category' => '業務項目', 'name' => '業務項目匯入'],
            ['category' => '業務項目', 'name' => '業務項目匯出'],

            ['category' => '專案列表', 'name' => '專案項目'],
            ['category' => '專案列表', 'name' => '查看專案'],
            ['category' => '專案列表', 'name' => '編輯專案'],
            ['category' => '專案列表', 'name' => '刪除專案'],
            ['category' => '專案列表', 'name' => '專案異動紀錄'],
            ['category' => '專案列表', 'name' => '專案匯入'],
            ['category' => '專案列表', 'name' => '專案匯出'],

            ['category' => '繳費紀錄', 'name' => '檢視繳費紀錄'],
            ['category' => '繳費紀錄', 'name' => '新增繳費紀錄'],
            ['category' => '繳費紀錄', 'name' => '編輯繳費紀錄'],
            ['category' => '繳費紀錄', 'name' => '刪除繳費紀錄'],
            ['category' => '繳費紀錄', 'name' => '匯出繳費紀錄'],


            ['category' => '合約', 'name' => '檢視合約'],
            ['category' => '合約', 'name' => '新增合約'],

            ['category' => '系統管理', 'name' => '使用者管理'],
            ['category' => '系統管理', 'name' => '角色管理'],
            ['category' => '系統管理', 'name' => '權限管理'],
            ['category' => '系統管理', 'name' => '系統設定'],
            ['category' => '業務管理', 'name' => '客戶管理'],
            ['category' => '業務管理', 'name' => '合約管理'],
            ['category' => '業務管理', 'name' => '業務項目管理'],
            ['category' => '業務管理', 'name' => '場館管理'],
        ];

        foreach ($permissions as $permission) {
            Permission::create($permission);
        }
    }
}