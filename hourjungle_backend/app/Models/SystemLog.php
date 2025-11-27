<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{

    protected $fillable = [
        'member_id',
        'action',
        'description',
        'sql_table',
        'sql_data_id',
        'sql_action',
        'created_at'
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}