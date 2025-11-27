<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bill extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_id',
        'customer_number',
        'customer_name',
        'company_name',
        'invoice_number',
        'invoice_period',
        'date',
        'time',
        'buyer',
        'address',
        'total_amount',
        'tax_type',
        'has_stamp',
        'seller_tax_id',
        'file_path',
        'ocr_text',
        'items_data'
    ];

    protected $casts = [
        'has_stamp' => 'boolean',
        'items_data' => 'array',
        'date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
