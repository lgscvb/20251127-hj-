<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProjectsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $projects;

    public function __construct($projects)
    {
        $this->projects = $projects;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        return $this->projects;
    }

    public function headings(): array
    {
        return [
            '專案名稱',
            '商務項目',
            '客戶名稱',
            '客戶公司名稱',
            '所屬館別',
            '起租時間',
            '結束時間',
            '簽約日期',
            '約定付款日期',
            '付款方案',
            '合約類型',
            '原價',
            '售價',
            '單期費用',
            '合約總金額',
            '違約金',
            '滯納金比例',
            '押金',
            '下次付款日期',
            '最後付款日期',
            '狀態',
            '合約狀態',
            '介紹人',
            '介紹人備註',
            '合約備註',
            '建立時間',
            '更新時間'
        ];
    }

    public function map($project): array
    {
        return [
            $project->projectName,
            $project->business_item_name,
            $project->customer_name,
            $project->customer_company_name,
            $project->branch_name,
            $project->start_day ? date('Y-m-d', strtotime($project->start_day)) : '',
            $project->end_day ? date('Y-m-d', strtotime($project->end_day)) : '',
            $project->signing_day ? date('Y-m-d', strtotime($project->signing_day)) : '',
            $project->pay_day,
            $this->getPaymentPeriod($project->payment_period),
            $project->contractType.'年約',
            $project->original_price,
            $project->sale_price,
            $project->current_payment,
            $project->total_payment,
            $project->penaltyFee,
            intval($project->lateFee).'%',
            $project->deposit,
            $project->next_pay_day ? date('Y-m-d', strtotime($project->next_pay_day)) : '',
            $project->last_pay_day ? date('Y-m-d H:i:s', strtotime($project->last_pay_day)) : '',
            $project->status ? '啟用' : '停用',
            $this->getContractStatus($project->contract_status),
            $project->broker,
            $project->broker_remark,
            $project->remark,
            $project->created_at ? date('Y-m-d H:i:s', strtotime($project->created_at)) : '',
            $project->updated_at ? date('Y-m-d H:i:s', strtotime($project->updated_at)) : ''
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
            'A1:AA1' => [
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'CCCCCC']
                ]
            ]
        ];
    }

    private function getPaymentPeriod($payment_period)
    {
        switch($payment_period){
            case 1:
                return '月繳';
            case 2:
                return '季繳';
            case 3:
                return '半年繳';
            case 4:
                return '年繳';
            case '月繳':
                return 1;
            case '季繳':
                return 2;
            case '半年繳':
                return 3;
            case '年繳':
                return 4;
        }
    }

    private function getContractStatus($status)
    {
        switch($status){
            case 0:
                return '未提交';
            case 1:
                return '審核中';
            case 2:
                return '已審核';
            case 3:
                return '未通過';
            case '未提交':
                return 0;
            case '審核中':
                return 1;
            case '已審核':
                return 2;
            case '未通過':
                return 3;
        }
    }
}
