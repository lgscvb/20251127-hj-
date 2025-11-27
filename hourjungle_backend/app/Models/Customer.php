<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    // 如果需要軟刪除，取消注釋下面這行
    use SoftDeletes;

    protected $table = 'customers';

    protected $fillable = [
        'number',
        'name',
        'email',
        'id_number',
        'birthday',
        'address',
        'phone',
        'company_name',
        'company_number',
        'company_website',
        'company_email',
        'company_address',
        'company_phone_number',
        'company_fax_number',
        'company_contact_person',
        'company_contact_person_phone_number',
        'company_contact_person_email',
        'line_id',
        'line_nickname',
        'id_card_front',
        'id_card_back',
        'remark',
        'status',
        'modify',
        'created_at',
        'updated_at',
        'branch_id',
        'branch_name'
    ];

    protected $casts = [
        'birthday' => 'date:Y-m-d',
        'status' => 'integer',
        'modify' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function setLineIdAttribute($value)
    {
        // 如果不是以 U 開頭的 33 位字符串，則不保存
        if ($value && !preg_match('/^U[a-zA-Z0-9]{32}$/', $value)) {
            \Log::warning('Invalid LINE ID format', ['value' => $value]);
            return;
        }
        $this->attributes['line_id'] = $value;
    }
}