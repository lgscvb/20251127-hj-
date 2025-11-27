<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Member;
use Illuminate\Support\Facades\DB;

class MemberRoleSeeder extends Seeder
{
    public function run()
    {
        $aa1111 = Member::where('account', 'aa1111')->first();
        
        DB::table('members_has_roles')->insert([
            'member_id' => $aa1111->id,
            'role_id' => 1
        ]);

        $admin = Member::where('account', 'admin')->first();
        
        DB::table('members_has_roles')->insert([
            'member_id' => $admin->id,
            'role_id' => 1
        ]);
        

        $demo01 = Member::where('account', 'demo01')->first();
        
        DB::table('members_has_roles')->insert([
            'member_id' => $demo01->id,
            'role_id' => 2
        ]);
        $demo02 = Member::where('account', 'demo02')->first();
        
        DB::table('members_has_roles')->insert([
            'member_id' => $demo02->id,
            'role_id' => 3
        ]);
        $demo03 = Member::where('account', 'demo03')->first();
        
        DB::table('members_has_roles')->insert([
            'member_id' => $demo03->id,
            'role_id' => 3
        ]);
        $demo04 = Member::where('account', 'demo04')->first();
        
        DB::table('members_has_roles')->insert([
            'member_id' => $demo04->id,
            'role_id' => 3
        ]);
        $demo05 = Member::where('account', 'demo05')->first();
        
        DB::table('members_has_roles')->insert([
            'member_id' => $demo05->id,
            'role_id' => 3
        ]);
        $demo06 = Member::where('account', 'demo06')->first();
        
        DB::table('members_has_roles')->insert([
            'member_id' => $demo06->id,
            'role_id' => 3
        ]);



        
    }
}