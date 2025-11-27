<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    // 如果需要軟刪除，取消注釋下面這行
    use SoftDeletes;

    protected $table = 'branches';

    protected $fillable = [
        'name',
        'address',
        'phone',
        'email',
        'website',
        'logo',
        'manager',
        'manager_phone',
        'manager_email',
        'description',
        'remarks',
        'status'
    ];

    public function members()
    {
        return $this->belongsToMany(Member::class)->withTimestamps();
    }

    /**
     * 获取场馆的Line Bot设置
     */
    public function lineBot()
    {
        return $this->hasOne(LineBot::class);
    }
}