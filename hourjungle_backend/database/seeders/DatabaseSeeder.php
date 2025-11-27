<?php

namespace Database\Seeders;

use App\Models\Config;
use App\Models\Branch;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Member;
use App\Models\BusinessItem;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            ConfigSeeder::class,
            BranchSeeder::class,
            RoleSeeder::class,
            PermissionSeeder::class,
            BusinessItemSeeder::class,
            MemberSeeder::class,
            RolePermissionSeeder::class,
            MemberRoleSeeder::class,
            MemberBranchSeeder::class,
            CustomerSeeder::class,
            ProjectSeeder::class,
            BillSeeder::class,
        ]);
    }
}
