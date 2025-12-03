<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BusinessItem;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

/**
 * 業務項目清理 Seeder
 *
 * 執行：php artisan db:seed --class=BusinessItemCleanupSeeder --force
 *
 * 此 Seeder 會：
 * 1. 刪除「月租固定座位」(ID 2)
 * 2. 刪除重複的「月租自由坐」(ID 47)
 * 3. 將環瑞館的辦公室 A-F 移到大忠館（如果沒有被使用）或刪除重複項
 */
class BusinessItemCleanupSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('=== 開始清理業務項目 ===');
        $this->command->info('');

        // 1. 檢查並刪除「月租固定座位」(ID 2)
        $this->command->info('1. 處理「月租固定座位」(ID 2)...');
        $item2 = BusinessItem::find(2);
        if ($item2) {
            // 檢查是否有專案使用此業務項目
            $projectCount = Project::where('business_item_id', 2)->count();
            if ($projectCount > 0) {
                $this->command->warn("   警告: 有 {$projectCount} 個專案使用此項目，無法刪除");
                // 改為停用
                $item2->update(['status' => 0]);
                $this->command->info("   已停用「{$item2->name}」");
            } else {
                $item2->forceDelete();
                $this->command->info("   已刪除「月租固定座位」");
            }
        } else {
            $this->command->info("   項目不存在，跳過");
        }

        // 2. 刪除重複的「月租自由坐」(ID 47) - 因為已有 ID 3「月租自由座位」
        $this->command->info('');
        $this->command->info('2. 處理重複的「月租自由坐」(ID 47)...');
        $item47 = BusinessItem::find(47);
        if ($item47) {
            $projectCount = Project::where('business_item_id', 47)->count();
            if ($projectCount > 0) {
                $this->command->warn("   警告: 有 {$projectCount} 個專案使用此項目，無法刪除");
                $item47->update(['status' => 0]);
                $this->command->info("   已停用「{$item47->name}」");
            } else {
                $item47->forceDelete();
                $this->command->info("   已刪除「月租自由坐」");
            }
        } else {
            $this->command->info("   項目不存在，跳過");
        }

        // 3. 處理環瑞館的辦公室 A-F (IDs 9-14)
        // 用戶說這些應該屬於大忠館，但我們已經建立了辦公室出租-A~F
        // 檢查是否有專案使用，如有則移到大忠館，否則刪除
        $this->command->info('');
        $this->command->info('3. 處理環瑞館的辦公室 A-F (IDs 9-14)...');

        $officeIds = [9, 10, 11, 12, 13, 14];
        foreach ($officeIds as $id) {
            $item = BusinessItem::find($id);
            if ($item && $item->branch_id == 2) {
                $projectCount = Project::where('business_item_id', $id)->count();
                if ($projectCount > 0) {
                    // 有專案使用，移到大忠館
                    $item->update(['branch_id' => 1]);
                    $this->command->info("   [{$id}] {$item->name}: 移到大忠館（有 {$projectCount} 個專案使用）");
                } else {
                    // 無專案使用，刪除（因為已有辦公室出租-A~F）
                    $item->forceDelete();
                    $this->command->info("   [{$id}] {$item->name}: 已刪除（無專案使用）");
                }
            }
        }

        // 4. 處理辦公室A1 (ID 8)
        $this->command->info('');
        $this->command->info('4. 處理「辦公室A1」(ID 8)...');
        $item8 = BusinessItem::find(8);
        if ($item8 && $item8->branch_id == 2) {
            $projectCount = Project::where('business_item_id', 8)->count();
            if ($projectCount > 0) {
                // 有專案使用，保留但移到大忠館
                $item8->update(['branch_id' => 1]);
                $this->command->info("   移到大忠館（有 {$projectCount} 個專案使用）");
            } else {
                $item8->forceDelete();
                $this->command->info("   已刪除（無專案使用）");
            }
        } else {
            $this->command->info("   項目不存在或已在大忠館，跳過");
        }

        // 5. 顯示最終結果
        $this->command->info('');
        $this->command->info('=== 業務項目清理完成 ===');

        $dazhongCount = BusinessItem::where('branch_id', 1)->where('status', 1)->count();
        $huanruiCount = BusinessItem::where('branch_id', 2)->where('status', 1)->count();

        $this->command->info("大忠館業務項目: {$dazhongCount} 項");
        $this->command->info("環瑞館業務項目: {$huanruiCount} 項");

        // 列出所有業務項目
        $this->command->info('');
        $this->command->info('=== 大忠館業務項目 ===');
        BusinessItem::where('branch_id', 1)->orderBy('id')->get()->each(function ($item) {
            $status = $item->status ? '啟用' : '停用';
            $this->command->info("  [{$item->id}] {$item->name} ({$status})");
        });

        $this->command->info('');
        $this->command->info('=== 環瑞館業務項目 ===');
        BusinessItem::where('branch_id', 2)->orderBy('id')->get()->each(function ($item) {
            $status = $item->status ? '啟用' : '停用';
            $this->command->info("  [{$item->id}] {$item->name} ({$status})");
        });
    }
}
