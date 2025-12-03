<?php

namespace Database\Seeders;

use App\Models\AccountingFirm;
use App\Models\Branch;
use App\Models\CommissionPayment;
use App\Models\Customer;
use App\Models\Project;
use App\Models\BusinessItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * CRM 資料遷移 Seeder
 * 從 Excel 轉換的 CSV 匯入資料到 Jungle CRM
 */
class CrmMigrationSeeder extends Seeder
{
    // CSV 檔案路徑（相對於 storage/app）
    private $customersFile = 'crm_migration/customers_transformed.csv';
    private $contractsFile = 'crm_migration/contracts_transformed.csv';
    private $commissionsFile = 'crm_migration/commissions_transformed.csv';

    // 場館對應
    private $branchMapping = [];

    // 客戶 legacy_id -> id 對應
    private $customerMapping = [];

    // 業務項目對應
    private $businessItemMapping = [];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('開始 CRM 資料遷移...');

        DB::beginTransaction();

        try {
            // Step 1: 建立/確認場館
            $this->setupBranches();

            // Step 2: 建立/確認業務項目
            $this->setupBusinessItems();

            // Step 3: 匯入客戶資料
            $this->importCustomers();

            // Step 4: 匯入合約資料
            $this->importContracts();

            // Step 5: 建立事務所對應
            $this->setupAccountingFirms();

            // Step 6: 匯入佣金資料
            $this->importCommissions();

            DB::commit();

            $this->command->info('✅ CRM 資料遷移完成！');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ 遷移失敗: ' . $e->getMessage());
            Log::error('CRM Migration Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * 建立場館
     */
    private function setupBranches(): void
    {
        $this->command->info('建立場館...');

        // 主館
        $headquarters = Branch::firstOrCreate(
            ['name' => '台灣大道館'],
            [
                'address' => '台中市西區台灣大道二段',
                'status' => 1
            ]
        );
        $this->branchMapping['headquarters'] = $headquarters->id;

        // 環瑞館
        $huanrui = Branch::firstOrCreate(
            ['name' => '環瑞館'],
            [
                'address' => '台中市',
                'status' => 1
            ]
        );
        $this->branchMapping['huanrui'] = $huanrui->id;

        $this->command->info("  - 台灣大道館 ID: {$headquarters->id}");
        $this->command->info("  - 環瑞館 ID: {$huanrui->id}");
    }

    /**
     * 建立業務項目
     */
    private function setupBusinessItems(): void
    {
        $this->command->info('建立業務項目...');

        $items = [
            'virtual_office' => '虛擬辦公室',
            'coworking_fixed' => '共享空間固定座',
            'coworking_flexible' => '共享空間自由座',
        ];

        foreach ($items as $code => $name) {
            $item = BusinessItem::firstOrCreate(
                ['name' => $name],
                ['status' => 1]
            );
            $this->businessItemMapping[$code] = $item->id;
            $this->command->info("  - {$name} ID: {$item->id}");
        }
    }

    /**
     * 匯入客戶資料
     */
    private function importCustomers(): void
    {
        $this->command->info('匯入客戶資料...');

        $path = storage_path('app/' . $this->customersFile);

        if (!file_exists($path)) {
            $this->command->warn("  ⚠️ 找不到客戶 CSV 檔案: {$path}");
            return;
        }

        $handle = fopen($path, 'r');
        $headers = fgetcsv($handle);
        $headers = array_map('trim', $headers);
        // 移除 BOM
        $headers[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $headers[0]);

        $count = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($headers, $row);

            // 檢查必要欄位
            if (empty($data['name']) || $data['name'] === 'nan') {
                $skipped++;
                continue;
            }

            // 轉換狀態
            $status = ($data['status'] ?? 'active') === 'active' ? 1 : 0;

            // 取得場館 ID（新格式直接使用數字，舊格式使用 mapping）
            $branchId = null;
            if (isset($data['branch_id']) && is_numeric($data['branch_id'])) {
                $branchId = (int) $data['branch_id'];
            } elseif (isset($data['location'])) {
                $branchId = $this->branchMapping[$data['location'] ?? 'headquarters'] ?? null;
            }

            // 處理生日
            $birthday = null;
            if (!empty($data['birthday']) && $data['birthday'] !== 'nan') {
                try {
                    $birthday = \Carbon\Carbon::parse($data['birthday'])->format('Y-m-d');
                } catch (\Exception $e) {
                    // 忽略無效日期
                }
            }

            // 取得客戶類型
            $customerType = $data['customer_type'] ?? 'individual';
            if (!in_array($customerType, ['individual', 'sole_proprietorship', 'company'])) {
                $customerType = 'individual';
            }

            // 建立或更新客戶
            $customer = Customer::updateOrCreate(
                ['number' => $data['legacy_id']],
                [
                    'name' => $data['name'],
                    'company_name' => $data['company_name'] !== '個人' ? $data['company_name'] : null,
                    'company_number' => $data['company_tax_id'] ?: null,
                    'id_number' => $data['id_number'] !== 'nan' ? $data['id_number'] : null,
                    'birthday' => $birthday,
                    'phone' => $data['phone'] !== 'nan' ? $data['phone'] : null,
                    'address' => $data['address'] !== 'nan' ? $data['address'] : null,
                    'email' => $data['email'] !== 'nan' ? $data['email'] : null,
                    'remark' => $data['industry_notes'] !== 'nan' ? $data['industry_notes'] : null,
                    'status' => $status,
                    'customer_type' => $customerType,
                    'branch_id' => $branchId,
                    'branch_name' => $branchId ? ($branchId == 1 ? '台灣大道館' : '環瑞館') : null,
                ]
            );

            // 記錄對應關係
            $this->customerMapping[$data['legacy_id']] = $customer->id;
            $count++;
        }

        fclose($handle);

        $this->command->info("  ✓ 匯入 {$count} 筆客戶，跳過 {$skipped} 筆");
    }

    /**
     * 匯入合約資料
     */
    private function importContracts(): void
    {
        $this->command->info('匯入合約資料...');

        $path = storage_path('app/' . $this->contractsFile);

        if (!file_exists($path)) {
            $this->command->warn("  ⚠️ 找不到合約 CSV 檔案: {$path}");
            return;
        }

        $handle = fopen($path, 'r');
        $headers = fgetcsv($handle);
        $headers = array_map('trim', $headers);
        $headers[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $headers[0]);

        $count = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) !== count($headers)) {
                $skipped++;
                continue;
            }
            $data = array_combine($headers, $row);

            // 找到對應的客戶
            $legacyId = $data['編號'] ?? null;
            $customerName = $data['姓名'] ?? null;

            // 嘗試用編號找客戶
            $customerId = null;
            if ($legacyId) {
                // 試著用 HQ-xx 或 HR-xx 格式查找
                foreach (['HQ-', 'HR-'] as $prefix) {
                    $fullId = $prefix . $legacyId;
                    if (isset($this->customerMapping[$fullId])) {
                        $customerId = $this->customerMapping[$fullId];
                        break;
                    }
                }
            }

            // 如果找不到，用名字找
            $customer = null;
            if (!$customerId && $customerName) {
                $customer = Customer::where('name', $customerName)->first();
                if ($customer) {
                    $customerId = $customer->id;
                }
            }

            // 找到客戶以取得 branch_id
            if ($customerId && !$customer) {
                $customer = Customer::find($customerId);
            }

            if (!$customerId) {
                $skipped++;
                continue;
            }

            // 取得業務項目
            $contractType = $data['contract_type'] ?? 'virtual_office';
            $businessItemId = $this->businessItemMapping[$contractType] ?? $this->businessItemMapping['virtual_office'];

            // 處理日期
            $startDate = $this->parseDate($data['start_date'] ?? null);
            $endDate = $this->parseDate($data['end_date'] ?? null);
            $signedAt = $this->parseDate($data['signed_at'] ?? null);

            if (!$startDate || !$endDate) {
                $skipped++;
                continue;
            }

            // 繳費週期轉換
            $paymentPeriodMap = [
                'monthly' => 1,
                'semi_annual' => 6,
                'annual' => 12,
                'biennial' => 24,
            ];
            $paymentPeriod = $paymentPeriodMap[$data['payment_cycle'] ?? 'monthly'] ?? 1;

            // 合約狀態
            $status = ($data['contract_status'] ?? 'active') === 'active' ? 1 : 0;

            // 月租金
            $monthlyRent = (float) ($data['monthly_rent'] ?? 0);

            // 押金
            $deposit = (float) ($data['deposit'] ?? 0);

            // 約定繳費日
            $payDay = (int) ($data['payment_day'] ?? 5);
            if ($payDay < 1 || $payDay > 31) {
                $payDay = 5;
            }

            // 計算合約年數
            $years = max(1, round(($endDate->diffInMonths($startDate)) / 12));
            $contractTypeStr = "{$years}年約";

            // 建立合約
            Project::create([
                'projectName' => ($data['公司'] ?? $customerName) . ' - ' . ($data['項目'] ?? '營登'),
                'business_item_id' => $businessItemId,
                'customer_id' => $customerId,
                'member_id' => 1, // 預設為系統管理員
                'branch_id' => $customer ? $customer->branch_id : 1, // 從客戶取得 branch_id
                'start_day' => $startDate,
                'end_day' => $endDate,
                'signing_day' => $signedAt ?? $startDate,
                'pay_day' => $payDay,
                'payment_period' => $paymentPeriod,
                'contractType' => $contractTypeStr,
                'original_price' => $monthlyRent,
                'sale_price' => $monthlyRent,
                'current_payment' => $monthlyRent * $paymentPeriod,
                'total_payment' => $monthlyRent * $years * 12,
                'deposit' => $deposit,
                'next_pay_day' => $this->calculateNextPayDay($startDate, $payDay),
                'status' => $status,
                'broker' => $data['介紹人'] ?? null,
                'remark' => $data['notes'] ?? $data['標註'] ?? null,
            ]);

            $count++;
        }

        fclose($handle);

        $this->command->info("  ✓ 匯入 {$count} 筆合約，跳過 {$skipped} 筆");
    }

    /**
     * 建立會計事務所對應
     */
    private function setupAccountingFirms(): void
    {
        $this->command->info('建立會計事務所...');

        // 從佣金資料中取得介紹人名單
        $path = storage_path('app/' . $this->commissionsFile);

        if (!file_exists($path)) {
            $this->command->warn("  ⚠️ 找不到佣金 CSV 檔案");
            return;
        }

        $handle = fopen($path, 'r');
        $headers = fgetcsv($handle);
        $headers = array_map('trim', $headers);
        $headers[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $headers[0]);

        $referrers = [];

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < count($headers)) {
                continue;
            }
            $data = array_combine($headers, $row);
            $referrer = $data['referrer_name'] ?? $data['介紹人'] ?? null;
            if ($referrer && $referrer !== 'nan' && !in_array($referrer, $referrers)) {
                $referrers[] = $referrer;
            }
        }

        fclose($handle);

        // 建立事務所
        foreach ($referrers as $referrer) {
            AccountingFirm::firstOrCreate(
                ['short_name' => $referrer],
                [
                    'name' => $referrer . '會計師事務所',
                    'status' => 1
                ]
            );
            $this->command->info("  - 建立事務所: {$referrer}");
        }
    }

    /**
     * 匯入佣金資料
     */
    private function importCommissions(): void
    {
        $this->command->info('匯入佣金資料...');

        $path = storage_path('app/' . $this->commissionsFile);

        if (!file_exists($path)) {
            $this->command->warn("  ⚠️ 找不到佣金 CSV 檔案");
            return;
        }

        $handle = fopen($path, 'r');
        $headers = fgetcsv($handle);
        $headers = array_map('trim', $headers);
        $headers[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $headers[0]);

        $count = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < count($headers)) {
                continue;
            }
            $data = array_combine($headers, $row);

            $customerName = $data['customer_name'] ?? $data['客戶'] ?? null;
            $referrerName = $data['referrer_name'] ?? $data['介紹人'] ?? null;
            $amount = (float) ($data['commission_amount'] ?? $data['金額'] ?? 0);
            $status = ($data['status'] ?? 'pending') === 'paid' ? 'paid' : 'pending';

            if (!$customerName || !$amount) {
                continue;
            }

            // 查找事務所
            $firmId = null;
            if ($referrerName && $referrerName !== 'nan') {
                $firm = AccountingFirm::where('short_name', $referrerName)->first();
                $firmId = $firm ? $firm->id : null;
            }

            // 查找客戶
            $customerId = null;
            $customer = Customer::where('company_name', $customerName)
                ->orWhere('name', $customerName)
                ->first();
            if ($customer) {
                $customerId = $customer->id;
            }

            // 處理合約開始日期
            $contractStart = $this->parseDate($data['contract_start'] ?? null);

            CommissionPayment::create([
                'accounting_firm_id' => $firmId,
                'customer_id' => $customerId,
                'customer_name' => $customerName,
                'referrer_name' => $referrerName,
                'contract_start' => $contractStart,
                'commission_amount' => $amount,
                'status' => $status,
                'paid_at' => $status === 'paid' ? $this->parseDate($data['paid_at'] ?? null) : null,
            ]);

            $count++;
        }

        fclose($handle);

        $this->command->info("  ✓ 匯入 {$count} 筆佣金記錄");
    }

    /**
     * 解析日期
     */
    private function parseDate(?string $dateStr): ?\Carbon\Carbon
    {
        if (!$dateStr || $dateStr === 'nan' || empty(trim($dateStr))) {
            return null;
        }

        try {
            return \Carbon\Carbon::parse($dateStr);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * 從 legacy ID 判斷場館
     */
    private function getBranchIdFromLegacyId(?string $legacyId): int
    {
        if (!$legacyId) {
            return $this->branchMapping['headquarters'] ?? 1;
        }

        // 嘗試在已知的對應中查找
        foreach ($this->customerMapping as $key => $id) {
            if (strpos($key, '-' . $legacyId) !== false || $key === $legacyId) {
                if (strpos($key, 'HR-') === 0) {
                    return $this->branchMapping['huanrui'] ?? 2;
                }
                return $this->branchMapping['headquarters'] ?? 1;
            }
        }

        return $this->branchMapping['headquarters'] ?? 1;
    }

    /**
     * 計算下次繳費日
     */
    private function calculateNextPayDay(\Carbon\Carbon $startDate, int $payDay): \Carbon\Carbon
    {
        $today = \Carbon\Carbon::today();
        $nextPay = $today->copy()->day($payDay);

        if ($nextPay->isPast()) {
            $nextPay->addMonth();
        }

        if ($nextPay->lt($startDate)) {
            $nextPay = $startDate->copy()->day($payDay);
            if ($nextPay->lt($startDate)) {
                $nextPay->addMonth();
            }
        }

        return $nextPay;
    }
}
