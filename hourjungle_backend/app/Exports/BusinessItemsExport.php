<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BusinessItemsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $businessItems;

    public function __construct($businessItems)
    {
        $this->businessItems = $businessItems;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        return $this->businessItems;
    }

    public function headings(): array
    {
        return [
            '業務項目編號',
            '業務項目名稱',
            '定價',
            '押金',
            '啟用狀態',
            '備註',
            '所屬分館',
            '建立時間'
        ];
    }

    public function map($businessItem): array
    {
        return [
            $businessItem->number,
            $businessItem->name,
            $businessItem->price,
            $businessItem->deposit,
            $businessItem->status ? '啟用' : '停用',
            $businessItem->remark,
            $businessItem->branch_name,
            $businessItem->created_at ? $businessItem->created_at->format('Y-m-d H:i:s') : ''
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
            'A1:H1' => [
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'CCCCCC']
                ]
            ]
        ];
    }
}
