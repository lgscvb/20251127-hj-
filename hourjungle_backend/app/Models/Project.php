<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use SoftDeletes;
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'projectName',
        'business_item_id',
        'customer_id',
        'member_id',
        'branch_id',
        'start_day',
        'end_day',
        'signing_day',
        'pay_day',
        'payment_period',
        'contractType',
        'original_price',
        'sale_price',
        'current_payment',
        'total_payment',
        'contract_status',
        'next_pay_day',
        'last_pay_day',
        'status',
        'broker',
        'broker_remark',
        'remark',
        'penaltyFee',
        'lateFee',
        'deposit',
        'confirmed_at',
        'confirmed_by',
        'signature_path',
        'contract_path',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_day' => 'date',
        'end_day' => 'date',
        'signing_day' => 'date',
        'next_pay_day' => 'date',
        'payment_period' => 'integer',
        'original_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'status' => 'integer',
        'penaltyFee' => 'decimal:2',
        'lateFee' => 'decimal:2',
        'deposit' => 'decimal:2',
        'pay_day' => 'integer',
        'last_pay_day' => 'date',
        'current_payment' => 'decimal:2',
        'total_payment' => 'decimal:2',
        'contract_status' => 'integer',
        'confirmed_at' => 'datetime',
        'confirmed_by' => 'integer',
    ];


    /**
     * 取得關聯的客戶
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * 取得關聯的商品
     */
    public function businessItem(): BelongsTo
    {
        return $this->belongsTo(BusinessItem::class);
    }

    /**
     * 取得關聯的會員
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    /**
     * 取得關聯的分店
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}