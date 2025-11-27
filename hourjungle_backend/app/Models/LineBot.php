<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LineBot extends Model
{

    protected $table = 'line_bots';

    protected $fillable = [
        'branch_id',
        'channel_secret',
        'channel_token',
        'liff_id',
        'payment_notice',
        'renewql_notice',
    ];

    /**
     * 获取关联的场馆
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
