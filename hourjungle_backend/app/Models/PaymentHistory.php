<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Project;
use App\Models\Customer;
use App\Models\Branch;

class PaymentHistory extends Model
{
    // 如果需要軟刪除，取消注釋下面這行
    use SoftDeletes;

    protected $fillable = [
        'project_id',
        'customer_id',
        'branch_id',
        'pay_day',
        'pay_type',
        'amount',
        'remark',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
    
}
