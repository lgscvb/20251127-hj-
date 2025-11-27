<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CustomersExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $customers;

    public function __construct($customers)
    {
        $this->customers = $customers;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        return $this->customers;
    }

    public function headings(): array
    {
        return [
            '客戶編號',
            '客戶姓名',
            '生日',
            '電話',
            '地址',
            '身分證字號',
            '電子郵件',
            '公司名稱',
            '統一編號',
            '公司電話',
            '公司傳真',
            '公司網站',
            '公司電子郵件',
            '公司地址',
            '聯絡人姓名',
            '聯絡人電話',
            '聯絡人信箱',
            '所屬分館',
            'LineID',
            'Line暱稱',
            '備注',
            '啟用狀態',
            '建立時間'
        ];
    }

    public function map($customer): array
    {
        return [
            $customer->number,
            $customer->name,
            $customer->birthday ? date('Y-m-d', strtotime($customer->birthday)) : '',
            $customer->phone,
            $customer->address,
            $customer->id_number,
            $customer->email,
            $customer->company_name,
            $customer->company_number,
            $customer->company_phone_number,
            $customer->company_fax_number,
            $customer->company_website,
            $customer->company_email,
            $customer->company_address,
            $customer->company_contact_person,
            $customer->company_contact_person_phone_number,
            $customer->company_contact_person_email,
            $customer->branch_name,
            $customer->line_id,
            $customer->line_nickname,
            $customer->remark,
            $customer->status ? '啟用' : '停用',
            $customer->created_at ? $customer->created_at->format('Y-m-d H:i:s') : ''
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
            'A1:W1' => [
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'CCCCCC']
                ]
            ]
        ];
    }
}
