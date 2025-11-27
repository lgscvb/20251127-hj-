<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BusinessItem;

class BusinessItemSeeder extends Seeder
{
    public function run()
    {
        $businessItems = [
            ['number' => '001', 'name' => '營業登記','price' => 3000,'deposit' => 6000,'branch_id' => 1,'status' => 1],
            ['number' => '002', 'name' => '月租固定座位','price' => 3000,'deposit' => 6000,'branch_id' => 1,'status' => 1],
            ['number' => '003', 'name' => '月租自由座位','price' => 3000,'deposit' => 6000,'branch_id' => 1,'status' => 1],
            ['number' => '004', 'name' => '月租辦公室','price' => 20000,'deposit' => 20000,'branch_id' => 1,'status' => 1],
            ['number' => '005', 'name' => '會議室租借','price' => 20000,'deposit' => 20000,'branch_id' => 1,'status' => 1],

            ['number' => '006', 'name' => '營業登記','price' => 3000,'deposit' => 6000,'branch_id' => 2,'status' => 1],
            ['number' => '007', 'name' => '共用辦公桌(不選桌)','price' => 3000,'deposit' => 6000,'branch_id' => 2,'status' => 1],
            ['number' => '008', 'name' => '辦公室A1','price' => 20000,'deposit' => 20000,'branch_id' => 2,'status' => 1],
            ['number' => '009', 'name' => '辦公室-A','price' => 20000,'deposit' => 20000,'branch_id' => 2,'status' => 1],
            ['number' => '010', 'name' => '辦公室-B','price' => 20000,'deposit' => 20000,'branch_id' => 2,'status' => 1],
            ['number' => '011', 'name' => '辦公室-C','price' => 20000,'deposit' => 20000,'branch_id' => 2,'status' => 1],
            ['number' => '012', 'name' => '辦公室-D','price' => 20000,'deposit' => 20000,'branch_id' => 2,'status' => 1],
            ['number' => '013', 'name' => '辦公室-E','price' => 20000,'deposit' => 20000,'branch_id' => 2,'status' => 1],
            ['number' => '014', 'name' => '辦公室-F','price' => 20000,'deposit' => 20000,'branch_id' => 2,'status' => 1],

            ['number' => '015', 'name' => '營業登記(半年約)','price' => 1800,'deposit' => 6000,'branch_id' => 3,'status' => 1],
            ['number' => '016', 'name' => '營業登記(一年約)','price' => 2000,'deposit' => 6000,'branch_id' => 3,'status' => 1],
            ['number' => '017', 'name' => '營業登記（一年半約）','price' => 1800,'deposit' => 6000,'branch_id' => 3,'status' => 1],
            ['number' => '018', 'name' => '營業登記（二年約）','price' => 2000,'deposit' => 6000,'branch_id' => 3,'status' => 1],
            ['number' => '019', 'name' => '綠卡會員','price' => 1800,'deposit' => 6000,'branch_id' => 3,'status' => 1],
            ['number' => '020', 'name' => '黑卡會員','price' => 1800,'deposit' => 6000,'branch_id' => 3,'status' => 1],
            ['number' => '021', 'name' => 'Daypass會員','price' => 3000,'deposit' => 6000,'branch_id' => 3,'status' => 1],
            ['number' => '022', 'name' => '會議室','price' => 2000,'deposit' => 20000,'branch_id' => 3,'status' => 1],
            ['number' => '023', 'name' => '教室空間','price' => 20000,'deposit' => 20000,'branch_id' => 3,'status' => 1],
            ['number' => '024', 'name' => '信件代收（一年約）','price' => 900,'deposit' => 1800,'branch_id' => 3,'status' => 1],

            ['number' => '025', 'name' => '營業登記（半年約）','price' => 1800,'deposit' => 6000,'branch_id' => 4,'status' => 1],
            ['number' => '026', 'name' => '營業登記（一年約）','price' => 2000,'deposit' => 6000,'branch_id' => 4,'status' => 1],
            ['number' => '027', 'name' => '營業登記（兩年約）','price' => 1800,'deposit' => 6000,'branch_id' => 4,'status' => 1],
            ['number' => '028', 'name' => '綠卡會員','price' => 1800,'deposit' => 6000,'branch_id' => 4,'status' => 1],
            ['number' => '029', 'name' => '黑卡會員','price' => 1800,'deposit' => 6000,'branch_id' => 4,'status' => 1], 
            ['number' => '030', 'name' => 'Daypass會員','price' => 3000,'deposit' => 6000,'branch_id' => 4,'status' => 1],
            ['number' => '031', 'name' => '開放座位（固定坐位）','price' => 2000,'deposit' => 20000,'branch_id' => 4,'status' => 1],
            ['number' => '032', 'name' => '開放座位（不固定坐位）','price' => 20000,'deposit' => 20000,'branch_id' => 4,'status' => 1],
            ['number' => '033', 'name' => '長租包廂','price' => 20000,'deposit' => 20000,'branch_id' => 4,'status' => 1],
            ['number' => '034', 'name' => '短租包廂','price' => 20000,'deposit' => 20000,'branch_id' => 4,'status' => 1],

            ['number' => '035', 'name' => '營業登記','price' => 3000,'deposit' => 6000,'branch_id' => 5,'status' => 1],
            ['number' => '036', 'name' => '綠卡會員','price' => 3000,'deposit' => 6000,'branch_id' => 5,'status' => 1],
            ['number' => '037', 'name' => '獨立工作室','price' => 20000,'deposit' => 20000,'branch_id' => 5,'status' => 1],
            ['number' => '038', 'name' => '聯絡處','price' => 3000,'deposit' => 6000,'branch_id' => 5,'status' => 1],
            ['number' => '039', 'name' => '固定坐位','price' => 2000,'deposit' => 20000,'branch_id' => 5,'status' => 1]
        ];

        foreach ($businessItems as $businessItem) {
            BusinessItem::create($businessItem);
        }
    }
}