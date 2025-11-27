<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run()
    {
        Role::create([
            'name' => '系統管理員',
            'status' => 1
        ]);
        Role::create([
            'name' => '主管',
            'status' => 1
        ]);

        Role::create([
            'name' => '員工',
            'status' => 1
        ]);
    }
} 