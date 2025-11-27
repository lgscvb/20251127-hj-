<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LineMessage extends Model
{
    protected $fillable = [
        'message_id',
        'user_id',
        'reply_token',
        'message_type',
        'message_text',
        'reply_text',
        'raw_data',
        'is_processed',
        'processed_at'
    ];

    protected $casts = [
        'raw_data' => 'array',
        'is_processed' => 'boolean',
        'processed_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(LineUser::class, 'user_id', 'user_id');
    }
}