<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
{
    // 如果需要軟刪除，取消注釋下面這行
    use SoftDeletes;

    protected $fillable = [
        'name',
        'status',
    ];

    /**
     * 定義狀態常量
     */
    const STATUS_DISABLED = 0;  // 禁用
    const STATUS_ENABLED = 1;   // 啟用

    /**
     * 檢查角色是否啟用
     */
    public function isEnabled()
    {
        return $this->status === self::STATUS_ENABLED;
    }

    /**
     * 與會員的多對多關聯
     */
    public function members()
    {
        return $this->belongsToMany(Member::class, 'members_has_roles');
    }

    /**
     * 與權限的多對多關聯
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_has_permissions');
    }
}