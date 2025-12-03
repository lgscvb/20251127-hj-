<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Project;
use App\Models\PaymentHistory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * 繳費記錄匯入 Seeder
 * 從 CSV 匯入繳費記錄到 payment_histories
 */
class PaymentHistorySeeder extends Seeder
{
    // CSV 檔案路徑（相對於 storage/app）
    private $paymentsFile = 'crm_migration/payments_ALL.csv';

    // 客戶 legacy_id -> id 對應
    private $customerMapping = [];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('開始匯入繳費記錄...');

        // 建立客戶對應表
        $this->buildCustomerMapping();

        DB::beginTransaction();

        try {
            $this->importPaymentHistories();

            DB::commit();

            $this->command->info('✅ 繳費記錄匯入完成！');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ 匯入失敗: ' . $e->getMessage());
            Log::error('Payment History Import Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * 建立客戶 legacy_id -> id 對應
     */
    private function buildCustomerMapping(): void
    {
        $this->command->info('建立客戶對應表...');

        $customers = Customer::all();
        foreach ($customers as $customer) {
            if ($customer->number) {
                $this->customerMapping[$customer->number] = $customer->id;
            }
        }

        $this->command->info("  - 載入 " . count($this->customerMapping) . " 筆客戶對應");
    }

    /**
     * 匯入繳費記錄
     */
    private function importPaymentHistories(): void
    {
        $this->command->info('匯入繳費記錄...');

        $path = storage_path('app/' . $this->paymentsFile);

        if (!file_exists($path)) {
            $this->command->warn("  ⚠️ 找不到繳費 CSV 檔案: {$path}");
            return;
        }

        $handle = fopen($path, 'r');
        $headers = fgetcsv($handle);
        $headers = array_map('trim', $headers);
        // 移除 BOM
        $headers[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $headers[0]);

        $count = 0;
        $skipped = 0;
        $noPaid = 0;
        $noCustomer = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) !== count($headers)) {
                $skipped++;
                continue;
            }
            $data = array_combine($headers, $row);

            // 只匯入已付款的記錄
            $paymentStatus = $data['payment_status'] ?? '';
            if ($paymentStatus !== 'paid') {
                $noPaid++;
                continue;
            }

            // 取得客戶 ID
            $legacyId = $data['customer_legacy_id'] ?? null;
            $customerId = $this->customerMapping[$legacyId] ?? null;

            if (!$customerId) {
                // 嘗試用名字找
                $customerName = $data['customer_name'] ?? null;
                if ($customerName) {
                    $customer = Customer::where('name', $customerName)->first();
                    if ($customer) {
                        $customerId = $customer->id;
                    }
                }
            }

            if (!$customerId) {
                $noCustomer++;
                continue;
            }

            // 取得金額
            $amount = (float) ($data['paid_amount'] ?? 0);
            if ($amount <= 0) {
                $skipped++;
                continue;
            }

            // 取得分館 ID
            $branchId = (int) ($data['branch_id'] ?? 1);

            // 計算付款日期（從 payment_period 推算）
            // payment_period 格式: 2025-01
            $paymentPeriod = $data['payment_period'] ?? null;
            $payDay = null;
            if ($paymentPeriod) {
                try {
                    // 使用期間的第一天作為付款日
                    $payDay = Carbon::parse($paymentPeriod . '-01')->format('Y-m-d');
                } catch (\Exception $e) {
                    // 如果解析失敗，嘗試用 year/month
                    $year = $data['year'] ?? date('Y');
                    $month = $data['month'] ?? 1;
                    $payDay = Carbon::create($year, $month, 1)->format('Y-m-d');
                }
            }

            if (!$payDay) {
                $skipped++;
                continue;
            }

            // 嘗試找到對應的合約（可選）
            $projectId = null;
            $contractStart = $data['contract_start'] ?? null;
            if ($contractStart && $customerId) {
                $project = Project::where('customer_id', $customerId)
                    ->whereDate('start_day', $contractStart)
                    ->first();
                if ($project) {
                    $projectId = $project->id;
                }
            }

            // 如果沒找到特定合約，找該客戶的任一活躍合約
            if (!$projectId && $customerId) {
                $project = Project::where('customer_id', $customerId)
                    ->where('status', 1)
                    ->first();
                if ($project) {
                    $projectId = $project->id;
                }
            }

            // 備註
            $notes = $data['notes'] ?? '';
            $lineMemo = $data['line_memo'] ?? '';
            $remark = trim($notes . ' ' . $lineMemo);
            if (empty($remark)) {
                $remark = null;
            }

            // 檢查是否已存在相同記錄（避免重複匯入）
            $exists = PaymentHistory::where('customer_id', $customerId)
                ->where('pay_day', $payDay)
                ->where('amount', $amount)
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            // 建立繳費記錄
            PaymentHistory::create([
                'project_id' => $projectId ?? 0, // 如果找不到合約，使用 0
                'customer_id' => $customerId,
                'branch_id' => $branchId,
                'pay_day' => $payDay,
                'pay_type' => 'transfer', // 預設轉帳
                'amount' => $amount,
                'remark' => $remark,
            ]);

            $count++;
        }

        fclose($handle);

        $this->command->info("  ✓ 匯入 {$count} 筆繳費記錄");
        $this->command->info("  - 跳過未付款：{$noPaid} 筆");
        $this->command->info("  - 找不到客戶：{$noCustomer} 筆");
        $this->command->info("  - 其他跳過：{$skipped} 筆");
    }
}
