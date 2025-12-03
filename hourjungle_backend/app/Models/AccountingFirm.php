<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * 會計事務所 Model
 * 用於管理介紹人/合作事務所資訊
 */
class AccountingFirm extends Model
{
    use SoftDeletes;

    protected $table = 'accounting_firms';

    protected $fillable = [
        'name',
        'short_name',
        'contact_person',
        'phone',
        'email',
        'address',
        'tax_id',
        'commission_rate',
        'remark',
        'status',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'status' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 取得該事務所的所有佣金記錄
     */
    public function commissionPayments()
    {
        return $this->hasMany(CommissionPayment::class);
    }

    /**
     * 透過簡稱查詢事務所
     */
    public static function findByShortName(string $shortName)
    {
        return self::where('short_name', $shortName)->first();
    }
}
