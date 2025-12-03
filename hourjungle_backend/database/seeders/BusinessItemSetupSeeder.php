<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BusinessItem;
use Illuminate\Support\Facades\DB;

/**
 * 業務項目設定 Seeder
 *
 * 執行：php artisan db:seed --class=BusinessItemSetupSeeder
 *
 * 此 Seeder 會：
 * 1. 刪除 ID 15-32 的測試資料（無 branch_id）
 * 2. 保留並更新現有的營業登記（ID 1）和月租固定座位（ID 2）
 * 3. 為大忠館（branch_id=1）建立完整業務項目
 * 4. 為環瑞館（branch_id=2）建立業務項目
 */
class BusinessItemSetupSeeder extends Seeder
{
    public function run(): void
    {
        // 1. 刪除 ID 15-32 的測試資料
        $this->command->info('刪除測試資料 (ID 15-32)...');
        BusinessItem::whereIn('id', range(15, 32))->forceDelete();

        // 2. 確保營業登記（ID 1）屬於大忠館
        $this->command->info('更新營業登記項目...');
        BusinessItem::where('id', 1)->update([
            'branch_id' => 1,
            'name' => '營業登記',
            'status' => 1
        ]);

        // 取得目前最大的 number
        $maxNumber = BusinessItem::max('number') ?? 0;

        // 3. 大忠館業務項目（branch_id=1）
        $this->command->info('建立大忠館業務項目...');

        $dazhongItems = [
            // 辦公室出租
            ['name' => '辦公室出租-A', 'branch_id' => 1, 'status' => 1, 'price' => 0, 'deposit' => 0],
            ['name' => '辦公室出租-B', 'branch_id' => 1, 'status' => 1, 'price' => 0, 'deposit' => 0],
            ['name' => '辦公室出租-C', 'branch_id' => 1, 'status' => 1, 'price' => 0, 'deposit' => 0],
            ['name' => '辦公室出租-D', 'branch_id' => 1, 'status' => 1, 'price' => 0, 'deposit' => 0],
            ['name' => '辦公室出租-E', 'branch_id' => 1, 'status' => 1, 'price' => 0, 'deposit' => 0],
            ['name' => '辦公室出租-F', 'branch_id' => 1, 'status' => 1, 'price' => 0, 'deposit' => 0],
            // 其他業務
            ['name' => '月租自由坐', 'branch_id' => 1, 'status' => 1, 'price' => 0, 'deposit' => 0],
            ['name' => '會議室租借', 'branch_id' => 1, 'status' => 1, 'price' => 0, 'deposit' => 0],
            ['name' => '場地租借', 'branch_id' => 1, 'status' => 1, 'price' => 0, 'deposit' => 0],
        ];

        foreach ($dazhongItems as $item) {
            // 檢查是否已存在
            $exists = BusinessItem::where('name', $item['name'])
                ->where('branch_id', $item['branch_id'])
                ->exists();

            if (!$exists) {
                $maxNumber++;
                $item['number'] = $maxNumber;
                BusinessItem::create($item);
                $this->command->info("  建立: {$item['name']} (number: {$maxNumber})");
            } else {
                $this->command->info("  已存在: {$item['name']}");
            }
        }

        // 4. 環瑞館業務項目（branch_id=2）
        $this->command->info('建立環瑞館業務項目...');

        $huanruiItems = [
            ['name' => '營業登記', 'branch_id' => 2, 'status' => 1, 'price' => 0, 'deposit' => 0],
            ['name' => '辦公室出租（整層長約）', 'branch_id' => 2, 'status' => 1, 'price' => 0, 'deposit' => 0],
        ];

        foreach ($huanruiItems as $item) {
            // 檢查是否已存在
            $exists = BusinessItem::where('name', $item['name'])
                ->where('branch_id', $item['branch_id'])
                ->exists();

            if (!$exists) {
                $maxNumber++;
                $item['number'] = $maxNumber;
                BusinessItem::create($item);
                $this->command->info("  建立: {$item['name']} (number: {$maxNumber})");
            } else {
                $this->command->info("  已存在: {$item['name']}");
            }
        }

        // 5. 顯示最終結果
        $this->command->info('');
        $this->command->info('=== 業務項目設定完成 ===');

        $dazhongCount = BusinessItem::where('branch_id', 1)->count();
        $huanruiCount = BusinessItem::where('branch_id', 2)->count();

        $this->command->info("大忠館業務項目: {$dazhongCount} 項");
        $this->command->info("環瑞館業務項目: {$huanruiCount} 項");

        // 列出所有業務項目
        $this->command->info('');
        $this->command->info('=== 大忠館業務項目 ===');
        BusinessItem::where('branch_id', 1)->get()->each(function ($item) {
            $this->command->info("  [{$item->id}] {$item->name}");
        });

        $this->command->info('');
        $this->command->info('=== 環瑞館業務項目 ===');
        BusinessItem::where('branch_id', 2)->get()->each(function ($item) {
            $this->command->info("  [{$item->id}] {$item->name}");
        });
    }
}
