<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessItem extends Model
{
    // 如果需要軟刪除，取消注釋下面這行
    use SoftDeletes;

    /**
     * 可以批量赋值的属性
     */
    protected $fillable = [
        'number',
        'name',
        'status',
        'branch_id',
        'price',
        'deposit',
        'remarks'
    ];

    /**
     * 属性类型转换
     */
    protected $casts = [
        'number' => 'integer',
        'status' => 'integer',
        'price' => 'decimal:2',
        'deposit' => 'decimal:2',
        'branch_id' => 'integer',
    ];

    /**
     * 追加到模型数组表单的访问器
     */
    // protected $appends = [
    //     'status_text'
    // ];

    /**
     * 获取状态文本
     */
    // public function getStatusTextAttribute()
    // {
    //     return $this->status === 1 ? '啟用' : '停用';
    // }

    /**
     * 范围查询：启用状态
     */
    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    /**
     * 范围查询：停用状态
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 0);
    }

    // 添加与 Branch 的关联关系
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }


}