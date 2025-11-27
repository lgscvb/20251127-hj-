<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LineUser extends Model
{
    protected $fillable = [
        'user_id',
        'display_name',
        'picture_url',
        'status_message',
        'user_data',
        'last_interaction'
    ];

    protected $casts = [
        'user_data' => 'array',
        'last_interaction' => 'datetime'
    ];

    public function messages()
    {
        return $this->hasMany(LineMessage::class, 'user_id', 'user_id');
    }
}