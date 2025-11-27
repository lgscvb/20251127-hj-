<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Bill;
use App\Models\Customer;
use Carbon\Carbon;

class BillSeeder extends Seeder
{
    public function run(): void
    {
        // 先確保有客戶數據
        $customer1 = Customer::firstOrCreate(
            ['name' => '測試科技股份有限公司'],
            [
                'address' => '台北市信義區信義路五段7號89樓',
            ]
        );

        $customer2 = Customer::firstOrCreate(
            ['name' => '創新餐飲有限公司'],
            [
                'address' => '台北市大安區敦化南路二段207號1樓',
            ]
        );

        $customer3 = Customer::firstOrCreate(
            ['name' => '雲端數位整合有限公司'],
            [
                'address' => '台北市中山區南京東路三段219號12樓',
            ]
        );

        $bills = [
            [
                'invoice_number' => 'AB12345678',
                'invoice_period' => '11204',
                'date' => Carbon::create(2023, 4, 15)->format('Y-m-d'),
                'time' => '14:30:00',
                'buyer' => '測試科技股份有限公司',
                'address' => '台北市信義區信義路五段7號89樓',
                'total_amount' => 52500.00,
                'tax_type' => '應稅',
                'has_stamp' => true,
                'seller_tax_id' => '12345678',
                'file_path' => 'invoices/tech_equipment.jpg',
                'customer_id' => $customer1->id,
                'customer_number' => 'CUS001',
                'customer_name' => $customer1->name,
                'company_name' => '測試科技股份有限公司',
                'ocr_text' => '電子發票證明聯\n發票號碼：AB12345678\n發票期別：11204\n日期：2023/04/15\n時間：14:30:00',
                'items_data' => json_encode([
                    [
                        'number' => '1',
                        'name' => '筆記型電腦 X Pro',
                        'quantity' => 2,
                        'unit_price' => 25000,
                        'amount' => 50000
                    ],
                    [
                        'number' => '2',
                        'name' => '無線滑鼠',
                        'quantity' => 5,
                        'unit_price' => 500,
                        'amount' => 2500
                    ]
                ])
            ],
            [
                'invoice_number' => 'CD87654321',
                'invoice_period' => '11204',
                'date' => Carbon::create(2023, 4, 16)->format('Y-m-d'),
                'time' => '09:15:00',
                'buyer' => '創新餐飲有限公司',
                'address' => '台北市大安區敦化南路二段207號1樓',
                'total_amount' => 8890.00,
                'tax_type' => '應稅',
                'has_stamp' => false,
                'seller_tax_id' => '87654321',
                'file_path' => 'invoices/restaurant_supplies.jpg',
                'customer_id' => $customer2->id,
                'customer_number' => 'CUS002',
                'customer_name' => $customer2->name,
                'company_name' => '創新餐飲有限公司',
                'ocr_text' => '電子發票證明聯\n發票號碼：CD87654321\n發票期別：11204\n日期：2023/04/16\n時間：09:15:00',
                'items_data' => json_encode([
                    [
                        'number' => '1',
                        'name' => '食材包',
                        'quantity' => 50,
                        'unit_price' => 168,
                        'amount' => 8400
                    ],
                    [
                        'number' => '2',
                        'name' => '一次性手套',
                        'quantity' => 7,
                        'unit_price' => 70,
                        'amount' => 490
                    ]
                ])
            ],
            [
                'invoice_number' => 'EF98765432',
                'invoice_period' => '11204',
                'date' => Carbon::create(2023, 4, 17)->format('Y-m-d'),
                'time' => '16:45:00',
                'buyer' => '雲端數位整合有限公司',
                'address' => '台北市中山區南京東路三段219號12樓',
                'total_amount' => 126000.00,
                'tax_type' => '零稅率',
                'has_stamp' => true,
                'seller_tax_id' => '23456789',
                'file_path' => 'invoices/cloud_service.jpg',
                'customer_id' => $customer3->id,
                'customer_number' => 'CUS003',
                'customer_name' => $customer3->name,
                'company_name' => '雲端數位整合有限公司',
                'ocr_text' => '電子發票證明聯\n發票號碼：EF98765432\n發票期別：11204\n日期：2023/04/17\n時間：16:45:00',
                'items_data' => json_encode([
                    [
                        'number' => '1',
                        'name' => '雲端服務器租用(年費)',
                        'quantity' => 1,
                        'unit_price' => 96000,
                        'amount' => 96000
                    ],
                    [
                        'number' => '2',
                        'name' => '技術支援服務',
                        'quantity' => 12,
                        'unit_price' => 2500,
                        'amount' => 30000
                    ]
                ])
            ]
        ];

        foreach ($bills as $bill) {
            Bill::create($bill);
        }
    }
}
