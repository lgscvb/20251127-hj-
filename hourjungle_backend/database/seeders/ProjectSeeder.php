<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;

class ProjectSeeder extends Seeder
{
    public function run()
    {
        

        Project::create([
            'projectName' => 'test',
            'business_item_id' => 1,
            'customer_id' => 1,
            'member_id' => 2,
            'branch_id' => 1,
            'original_price' => 3000,
            'start_day' => date('Y-m-d'),
            'end_day' => date('Y-m-d', strtotime('+1 year')),
            'signing_day' => date('Y-m-d'),
            'pay_day' => 5,
            'next_pay_day' => date('Y-m-d', strtotime('+1 month')),
            'payment_period' => 1, // monthly
            'contractType' => 1,
            'sale_price' => 1800,
            'current_payment' => 1800,
            'total_payment' => 21600,
            'contract_status' => 0,
            'status' => 1
        ]);
    }
} 