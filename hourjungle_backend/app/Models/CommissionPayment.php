<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * 佣金記錄 Model
 * 用於管理介紹人佣金支付記錄
 */
class CommissionPayment extends Model
{
    use SoftDeletes;

    protected $table = 'commission_payments';

    protected $fillable = [
        'accounting_firm_id',
        'customer_id',
        'project_id',
        'customer_name',
        'referrer_name',
        'contract_start',
        'eligible_date',
        'commission_amount',
        'status',
        'paid_at',
        'payment_method',
        'remark',
    ];

    protected $casts = [
        'contract_start' => 'date',
        'eligible_date' => 'date',
        'paid_at' => 'date',
        'commission_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 取得關聯的會計事務所
     */
    public function accountingFirm()
    {
        return $this->belongsTo(AccountingFirm::class);
    }

    /**
     * 取得關聯的客戶
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * 取得關聯的合約
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * 取得待付款的佣金
     */
    public static function getPending()
    {
        return self::where('status', 'pending')->get();
    }

    /**
     * 取得已符合資格的佣金
     */
    public static function getEligible()
    {
        return self::where('status', 'eligible')->get();
    }

    /**
     * 計算待付佣金總額
     */
    public static function getTotalPending()
    {
        return self::whereIn('status', ['pending', 'eligible'])->sum('commission_amount');
    }
}
