<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Project;
use App\Models\CommissionPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * 資料品質檢查 Controller
 * 用於顯示 CRM 資料的異常提醒
 */
class DataQualityController extends Controller
{
    /**
     * 取得資料品質警告清單
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getWarnings()
    {
        $warnings = [];

        // 1. 檢查日期異常的合約
        $dateIssues = $this->checkDateIssues();
        if (count($dateIssues) > 0) {
            $warnings[] = [
                'type' => 'date_issues',
                'severity' => 'warning',
                'title' => '日期格式異常',
                'count' => count($dateIssues),
                'message' => count($dateIssues) . ' 筆合約的日期格式異常，需要手動確認',
                'details' => $dateIssues
            ];
        }

        // 2. 檢查缺少 Email 的活躍客戶
        $missingEmail = $this->checkMissingEmail();
        if ($missingEmail['count'] > 0) {
            $warnings[] = [
                'type' => 'missing_email',
                'severity' => 'info',
                'title' => 'Email 資料不完整',
                'count' => $missingEmail['count'],
                'message' => "只有 {$missingEmail['percentage']}% 的客戶有 Email",
                'details' => []
            ];
        }

        // 3. 檢查即將到期的合約
        $expiringContracts = $this->checkExpiringContracts();
        if (count($expiringContracts) > 0) {
            $warnings[] = [
                'type' => 'expiring_contracts',
                'severity' => 'warning',
                'title' => '合約即將到期',
                'count' => count($expiringContracts),
                'message' => count($expiringContracts) . ' 筆合約將在 30 天內到期',
                'details' => $expiringContracts
            ];
        }

        // 4. 檢查已到期但未處理的合約
        $expiredContracts = $this->checkExpiredContracts();
        if (count($expiredContracts) > 0) {
            $warnings[] = [
                'type' => 'expired_contracts',
                'severity' => 'error',
                'title' => '合約已到期',
                'count' => count($expiredContracts),
                'message' => count($expiredContracts) . ' 筆合約已到期未處理',
                'details' => $expiredContracts
            ];
        }

        // 5. 檢查待付佣金
        $pendingCommissions = $this->checkPendingCommissions();
        if ($pendingCommissions['count'] > 0) {
            $warnings[] = [
                'type' => 'pending_commissions',
                'severity' => 'info',
                'title' => '待付佣金',
                'count' => $pendingCommissions['count'],
                'message' => "有 {$pendingCommissions['count']} 筆佣金待付，總額 $" . number_format($pendingCommissions['total']),
                'details' => $pendingCommissions['details']
            ];
        }

        // 6. 檢查電話格式異常
        $phoneIssues = $this->checkPhoneIssues();
        if (count($phoneIssues) > 0) {
            $warnings[] = [
                'type' => 'phone_issues',
                'severity' => 'info',
                'title' => '電話格式異常',
                'count' => count($phoneIssues),
                'message' => count($phoneIssues) . ' 筆客戶電話格式異常',
                'details' => $phoneIssues
            ];
        }

        // 7. 檢查統編格式異常
        $taxIdIssues = $this->checkTaxIdIssues();
        if (count($taxIdIssues) > 0) {
            $warnings[] = [
                'type' => 'tax_id_issues',
                'severity' => 'info',
                'title' => '統編格式異常',
                'count' => count($taxIdIssues),
                'message' => count($taxIdIssues) . ' 筆客戶統編格式不正確',
                'details' => $taxIdIssues
            ];
        }

        return response()->json([
            'status' => true,
            'message' => '查詢成功',
            'data' => [
                'warnings' => $warnings,
                'summary' => [
                    'total_warnings' => count($warnings),
                    'error_count' => count(array_filter($warnings, fn($w) => $w['severity'] === 'error')),
                    'warning_count' => count(array_filter($warnings, fn($w) => $w['severity'] === 'warning')),
                    'info_count' => count(array_filter($warnings, fn($w) => $w['severity'] === 'info')),
                ]
            ]
        ]);
    }

    /**
     * 檢查日期異常
     */
    private function checkDateIssues(): array
    {
        $issues = [];

        // 檢查開始日期為 null 或異常的合約
        $projects = Project::whereNull('start_day')
            ->orWhereNull('end_day')
            ->orWhereRaw('end_day < start_day')
            ->with('customer:id,name,company_name')
            ->limit(10)
            ->get();

        foreach ($projects as $project) {
            $issues[] = [
                'id' => $project->id,
                'customer' => $project->customer?->company_name ?? $project->customer?->name ?? '未知',
                'start_date' => $project->start_day?->format('Y-m-d') ?? '無',
                'end_date' => $project->end_day?->format('Y-m-d') ?? '無',
                'issue' => $this->describeDateIssue($project)
            ];
        }

        return $issues;
    }

    /**
     * 描述日期問題
     */
    private function describeDateIssue($project): string
    {
        if (!$project->start_day) {
            return '缺少開始日期';
        }
        if (!$project->end_day) {
            return '缺少結束日期';
        }
        if ($project->end_day < $project->start_day) {
            return '結束日期早於開始日期';
        }
        return '未知問題';
    }

    /**
     * 檢查缺少 Email
     */
    private function checkMissingEmail(): array
    {
        $total = Customer::where('status', 1)->count();
        $withEmail = Customer::where('status', 1)->whereNotNull('email')->count();
        $percentage = $total > 0 ? round(($withEmail / $total) * 100, 1) : 0;

        return [
            'count' => $total - $withEmail,
            'total' => $total,
            'percentage' => $percentage
        ];
    }

    /**
     * 檢查即將到期的合約（30天內）
     */
    private function checkExpiringContracts(): array
    {
        $today = now();
        $thirtyDaysLater = now()->addDays(30);

        $projects = Project::where('status', 1)
            ->whereBetween('end_day', [$today, $thirtyDaysLater])
            ->with('customer:id,name,company_name')
            ->orderBy('end_day')
            ->limit(10)
            ->get();

        return $projects->map(function ($project) {
            return [
                'id' => $project->id,
                'customer' => $project->customer?->company_name ?? $project->customer?->name ?? '未知',
                'end_date' => $project->end_day?->format('Y-m-d'),
                'days_left' => now()->diffInDays($project->end_day),
                'monthly_rent' => $project->current_payment
            ];
        })->toArray();
    }

    /**
     * 檢查已到期的合約
     */
    private function checkExpiredContracts(): array
    {
        $today = now();

        $projects = Project::where('status', 1)
            ->where('end_day', '<', $today)
            ->with('customer:id,name,company_name')
            ->orderBy('end_day', 'desc')
            ->limit(10)
            ->get();

        return $projects->map(function ($project) {
            return [
                'id' => $project->id,
                'customer' => $project->customer?->company_name ?? $project->customer?->name ?? '未知',
                'end_date' => $project->end_day?->format('Y-m-d'),
                'days_overdue' => $project->end_day?->diffInDays(now()),
                'monthly_rent' => $project->current_payment
            ];
        })->toArray();
    }

    /**
     * 檢查待付佣金
     */
    private function checkPendingCommissions(): array
    {
        $commissions = CommissionPayment::whereIn('status', ['pending', 'eligible'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $total = CommissionPayment::whereIn('status', ['pending', 'eligible'])->sum('commission_amount');

        return [
            'count' => $commissions->count(),
            'total' => $total,
            'details' => $commissions->map(function ($commission) {
                return [
                    'id' => $commission->id,
                    'customer' => $commission->customer_name,
                    'referrer' => $commission->referrer_name,
                    'amount' => $commission->commission_amount,
                    'status' => $commission->status
                ];
            })->toArray()
        ];
    }

    /**
     * 檢查電話格式異常
     */
    private function checkPhoneIssues(): array
    {
        $issues = [];

        // 找出電話格式不正確的客戶
        $customers = Customer::whereNotNull('phone')
            ->where('phone', '!=', '')
            ->whereRaw("phone NOT REGEXP '^09[0-9]{8}$'")
            ->limit(10)
            ->get();

        foreach ($customers as $customer) {
            $issues[] = [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'issue' => $this->describePhoneIssue($customer->phone)
            ];
        }

        return $issues;
    }

    /**
     * 描述電話問題
     */
    private function describePhoneIssue(string $phone): string
    {
        if (preg_match('/^0[2-8]/', $phone)) {
            return '市話（非手機）';
        }
        if (strlen(preg_replace('/\D/', '', $phone)) < 10) {
            return '號碼不足10碼';
        }
        if (strlen(preg_replace('/\D/', '', $phone)) > 10) {
            return '號碼超過10碼';
        }
        return '格式異常';
    }

    /**
     * 檢查統編格式異常
     */
    private function checkTaxIdIssues(): array
    {
        $issues = [];

        // 找出統編格式不正確的客戶
        $customers = Customer::whereNotNull('company_number')
            ->where('company_number', '!=', '')
            ->whereRaw("company_number NOT REGEXP '^[0-9]{8}$'")
            ->limit(10)
            ->get();

        foreach ($customers as $customer) {
            $issues[] = [
                'id' => $customer->id,
                'name' => $customer->name,
                'company_name' => $customer->company_name,
                'tax_id' => $customer->company_number,
                'issue' => strlen($customer->company_number) != 8 ? '非8位數' : '包含非數字'
            ];
        }

        return $issues;
    }

    /**
     * 取得統計摘要
     */
    public function getSummary()
    {
        $totalCustomers = Customer::count();
        $activeCustomers = Customer::where('status', 1)->count();
        $totalContracts = Project::count();
        $activeContracts = Project::where('status', 1)->count();
        $totalCommissions = CommissionPayment::sum('commission_amount');
        $pendingCommissions = CommissionPayment::whereIn('status', ['pending', 'eligible'])->sum('commission_amount');

        return response()->json([
            'status' => true,
            'data' => [
                'customers' => [
                    'total' => $totalCustomers,
                    'active' => $activeCustomers
                ],
                'contracts' => [
                    'total' => $totalContracts,
                    'active' => $activeContracts
                ],
                'commissions' => [
                    'total' => $totalCommissions,
                    'pending' => $pendingCommissions
                ]
            ]
        ]);
    }
}
