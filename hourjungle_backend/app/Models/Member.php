<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    // 如果需要軟刪除，取消注釋下面這行
    use SoftDeletes;

    /**
     * 可以被批量賦值的屬性
     */
    protected $fillable = [
        'account',
        'nickname',
        'password',
        'email',
        'phone',
        'token',
        'status',
        'is_top_account',
        'role_id',
        'branch_id',
        'last_login',
        'created_at',
        'updated_at'
    ];

    /**
     * 隱藏不應該被序列化的屬性
     */
    protected $hidden = [
        'password',
        'token',
    ];

    /**
     * 應該被轉換為日期的屬性
     */
    protected $dates = [
        'last_login',
        'created_at',
        'updated_at',
    ];

    /**
     * 屬性的預設值
     */
    protected $attributes = [
        'status' => 1,
    ];

    /**
     * 與角色的多對多關聯
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'members_has_roles');
    }

    /**
     * 檢查用戶是否啟用
     */
    public function isActive()
    {
        return $this->status === 1;
    }

    /**
     * 更新最後登入時間
     */
    public function updateLastLogin()
    {
        $this->last_login = now();
        $this->save();
    }

    /**
     * 檢查用戶是否具有指定角色
     */
    public function hasRole($roleName)
    {
        return $this->roles()->where('name', $roleName)->exists();
    }

    /**
     * 檢查用戶是否具有指定權限
     */
    public function hasPermission($permissionName)
    {
        return $this->roles()->whereHas('permissions', function($query) use ($permissionName) {
            $query->where('name', $permissionName);
        })->exists();
    }

    /**
     * 獲取用戶所有權限
     */
    public function getAllPermissions()
    {
        return Permission::whereHas('roles', function($query) {
            $query->whereIn('roles.id', $this->roles()->pluck('roles.id'));
        })->get();
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * 獲取該成員的角色
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

}
