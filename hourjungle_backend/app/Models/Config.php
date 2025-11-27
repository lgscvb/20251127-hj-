<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Config extends Model
{
    protected $fillable = [
        'overdue_days',
        'late_fee',
        'penalty_fee',
        'hash_key',
        'hash_iv',
        'validate',
        'callback_url',
        'line_webhook_url'
    ];

    protected $table = 'config';
}
