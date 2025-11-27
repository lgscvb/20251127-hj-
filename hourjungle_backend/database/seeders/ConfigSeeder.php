<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Config;

class ConfigSeeder extends Seeder
{
    public function run()
    {
        Config::create([
            'overdue_days' => 5,
            'late_fee' => 3,
            'penalty_fee' => 6000,
            'hash_key' => '',
            'hash_iv' => '',
            'validate' => '',
            'callback_url' => '',
            'line_webhook_url' => 'https://abc7-123-240-73-29.ngrok-free.app/api/webhook'
        ]);
    }
} 