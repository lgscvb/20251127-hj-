<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Member;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;

class MemberBranchSeeder extends Seeder
{
    public function run()
    {
        $aa1111 = Member::where('account', 'aa1111')->first();
        
        DB::table('branch_member')->insert([
            'member_id' => $aa1111->id,
            'branch_id' => 1,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $admin = Member::where('account', 'admin')->first();
        
        DB::table('branch_member')->insert([
            'member_id' => $admin->id,
            'branch_id' => 1,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $demo01 = Member::where('account', 'demo01')->first();
        
        DB::table('branch_member')->insert([
            'member_id' => $demo01->id,
            'branch_id' => 1,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $demo02 = Member::where('account', 'demo02')->first();
        
        DB::table('branch_member')->insert([
            'member_id' => $demo02->id,
            'branch_id' => 1,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        $demo03 = Member::where('account', 'demo03')->first();
        
        DB::table('branch_member')->insert([
            'member_id' => $demo03->id,
            'branch_id' => 2,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        $demo04 = Member::where('account', 'demo04')->first();
        
        DB::table('branch_member')->insert([
            'member_id' => $demo04->id,
            'branch_id' => 3,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        $demo05 = Member::where('account', 'demo05')->first();
        
        DB::table('branch_member')->insert([
            'member_id' => $demo05->id,
            'branch_id' => 4,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        $demo06 = Member::where('account', 'demo06')->first();
        
        DB::table('branch_member')->insert([
            'member_id' => $demo06->id,
            'branch_id' => 5,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
}