<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Permission extends Model
{
    // 如果需要軟刪除，取消注釋下面這行
    use SoftDeletes;

    /**
     * 可以批量賦值的屬性
     *
     * @var array
     */
    protected $fillable = [
        'category',
        'name',
    ];

    /**
     * 屬性的默認值
     *
     * @var array
     */
    protected $attributes = [
        'category' => null,
        'name' => null,
    ];

    /**
     * 與角色的多對多關聯
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_has_permissions');
    }
}