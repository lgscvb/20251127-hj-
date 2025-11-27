<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // 取得系統管理員角色
        $adminRole = Role::where('name', '系統管理員')->first();
        
        // 取得所有權限
        $permissions = Permission::all();

        // 為系統管理員賦予所有權限
        foreach ($permissions as $permission) {
            DB::table('role_has_permissions')->insert([
                'role_id' => $adminRole->id,
                'permission_id' => $permission->id
            ]);
        }

        // 取得主管角色
        $managerRole = Role::where('name', '主管')->first();

        // 為主管賦予部分權限
        $managerPermissions = $permissions->whereIn('id', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 34, 35, 36]);
        foreach ($managerPermissions as $permission) {
            DB::table('role_has_permissions')->insert([
                'role_id' => $managerRole->id,
                'permission_id' => $permission->id
            ]);
        }

        // 取得員工角色
        $employeeRole = Role::where('name', '員工')->first();

        // 為員工賦予部分權限
        $employeePermissions = $permissions->whereIn('id', [1, 2, 3,  5, 8, 9, 10, 12, 15, 16, 17, 19, 22, 23, ]);
        foreach ($employeePermissions as $permission) {
            DB::table('role_has_permissions')->insert([
                'role_id' => $employeeRole->id,
                'permission_id' => $permission->id
            ]);
        }
        

        
    }
}