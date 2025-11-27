<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Member;
use Illuminate\Support\Facades\Hash;

class MemberSeeder extends Seeder
{
    public function run()
    {
        Member::create([
            'account' => 'admin',
            'password' => Hash::make('admin'),
            'nickname' => '系統管理員',
            'email' => 'admin@example.com',
            'status' => 1,
            'role_id' => 1,
            'branch_id' => 1,
            'is_top_account' => 1
        ]);

        Member::create([
            'account' => 'aa1111',
            'password' => Hash::make('aa1111'),
            'nickname' => 'aa1111',
            'email' => 'aa1111@example.com',
            'status' => 1,
            'role_id' => 2,
            'branch_id' => 1,
            'is_top_account' => 1
        ]);

        Member::create([
            'account' => 'demo01',
            'password' => Hash::make('123456'),
            'nickname' => '員工1',
            'email' => 'demo01@example.com',
            'status' => 1,
            'role_id' => 3,
            'branch_id' => 1,
            'is_top_account' => 0
        ]);

        Member::create([
            'account' => 'demo02',
            'password' => Hash::make('123456'),
            'nickname' => '員工2',
            'email' => 'demo02@example.com',
            'status' => 1,
            'role_id' => 3,
            'branch_id' => 1,
            'is_top_account' => 0
        ]);

        Member::create([
            'account' => 'demo03',
            'password' => Hash::make('123456'),
            'nickname' => '員工3',
            'email' => 'demo03@example.com',
            'status' => 1,
            'role_id' => 3,
            'branch_id' => 2,
            'is_top_account' => 0
        ]);

        Member::create([
            'account' => 'demo04',
            'password' => Hash::make('123456'),
            'nickname' => '員工4',
            'email' => 'demo04@example.com',
            'status' => 1,
            'role_id' => 3,
            'branch_id' => 3,
            'is_top_account' => 0
        ]);

        Member::create([
            'account' => 'demo05',
            'password' => Hash::make('123456'),
            'nickname' => '員工5',
            'email' => 'demo05@example.com',
            'status' => 1,
            'role_id' => 3,
            'branch_id' => 4,
            'is_top_account' => 0
        ]);

        Member::create([
            'account' => 'demo06',
            'password' => Hash::make('123456'),
            'nickname' => '員工6',
            'email' => 'demo06@example.com',
            'status' => 1,
            'role_id' => 3,
            'branch_id' => 5,
            'is_top_account' => 0
        ]);
    }
}