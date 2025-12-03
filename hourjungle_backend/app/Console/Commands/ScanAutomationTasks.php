<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AutomationTask;
use App\Models\Project;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * 掃描並建立自動化任務（繳費/續約提醒）
 * 排程：每日執行一次
 */
class ScanAutomationTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'automation:scan
                            {--dry-run : 只顯示會建立的任務，不實際建立}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '掃描合約並建立提醒任務（繳費提醒：7天+3天前，續約提醒：60天+30天前）';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $this->info('====================================');
        $this->info('自動化任務掃描程序');
        $this->info('====================================');

        if ($dryRun) {
            $this->warn('>> DRY RUN 模式 - 不會實際建立任務');
        }

        $today = Carbon::today();
        $created = [
            'payment_reminders' => 0,
            'renewal_reminders' => 0,
        ];
        $skipped = [
            'no_line_id' => 0,
            'already_exists' => 0,
        ];

        // 取得所有活躍合約
        $activeProjects = Project::where('status', 1)
            ->with('customer')
            ->get();

        $this->info("找到 {$activeProjects->count()} 個活躍合約");

        foreach ($activeProjects as $project) {
            // 檢查客戶是否有 LINE ID
            if (!$project->customer || !$project->customer->line_id) {
                $skipped['no_line_id']++;
                continue;
            }

            // === 繳費提醒 ===
            if ($project->next_pay_day) {
                $nextPayDay = Carbon::parse($project->next_pay_day);

                // 7 天前提醒
                $reminderDate7 = $nextPayDay->copy()->subDays(7);
                if ($reminderDate7->isToday() || $reminderDate7->isFuture()) {
                    $result = $this->createPaymentReminderIfNotExists($project, $reminderDate7, 7, $dryRun);
                    if ($result === 'created') {
                        $created['payment_reminders']++;
                    } elseif ($result === 'exists') {
                        $skipped['already_exists']++;
                    }
                }

                // 3 天前提醒
                $reminderDate3 = $nextPayDay->copy()->subDays(3);
                if ($reminderDate3->isToday() || $reminderDate3->isFuture()) {
                    $result = $this->createPaymentReminderIfNotExists($project, $reminderDate3, 3, $dryRun);
                    if ($result === 'created') {
                        $created['payment_reminders']++;
                    } elseif ($result === 'exists') {
                        $skipped['already_exists']++;
                    }
                }
            }

            // === 續約提醒 ===
            if ($project->end_day) {
                $endDay = Carbon::parse($project->end_day);

                // 60 天前提醒
                $reminderDate60 = $endDay->copy()->subDays(60);
                if ($reminderDate60->isToday() || $reminderDate60->isFuture()) {
                    $result = $this->createRenewalReminderIfNotExists($project, $reminderDate60, 60, $dryRun);
                    if ($result === 'created') {
                        $created['renewal_reminders']++;
                    } elseif ($result === 'exists') {
                        $skipped['already_exists']++;
                    }
                }

                // 30 天前提醒
                $reminderDate30 = $endDay->copy()->subDays(30);
                if ($reminderDate30->isToday() || $reminderDate30->isFuture()) {
                    $result = $this->createRenewalReminderIfNotExists($project, $reminderDate30, 30, $dryRun);
                    if ($result === 'created') {
                        $created['renewal_reminders']++;
                    } elseif ($result === 'exists') {
                        $skipped['already_exists']++;
                    }
                }
            }
        }

        $this->line('');
        $this->info('====================================');
        $this->info('掃描結果摘要');
        $this->info('====================================');
        $this->line("繳費提醒任務：{$created['payment_reminders']} 個");
        $this->line("續約提醒任務：{$created['renewal_reminders']} 個");
        $this->line("跳過（無 LINE ID）：{$skipped['no_line_id']} 個");
        $this->line("跳過（已存在）：{$skipped['already_exists']} 個");

        Log::info('自動化任務掃描完成', [
            'created' => $created,
            'skipped' => $skipped,
        ]);

        return Command::SUCCESS;
    }

    /**
     * 建立繳費提醒（如果不存在）
     */
    private function createPaymentReminderIfNotExists($project, $scheduledAt, $daysBefore, $dryRun = false)
    {
        if (AutomationTask::hasPendingTask(
            AutomationTask::TYPE_PAYMENT_REMINDER,
            $project->customer_id,
            $project->id,
            $scheduledAt->toDateString()
        )) {
            return 'exists';
        }

        $payload = [
            'customer_name' => $project->customer->name,
            'company_name' => $project->customer->company_name,
            'project_name' => $project->projectName,
            'next_pay_day' => $project->next_pay_day,
            'amount' => $project->current_payment,
            'days_before' => $daysBefore,
            'message' => $this->generatePaymentReminderMessage($project, $daysBefore),
        ];

        if ($dryRun) {
            $this->line("  [DRY RUN] 繳費提醒：{$project->customer->name} - {$scheduledAt->toDateString()} ({$daysBefore}天前)");
            return 'created';
        }

        AutomationTask::createPaymentReminder(
            $project->customer_id,
            $project->id,
            $scheduledAt,
            $payload
        );

        $this->line("  建立繳費提醒：{$project->customer->name} - {$scheduledAt->toDateString()} ({$daysBefore}天前)");

        return 'created';
    }

    /**
     * 建立續約提醒（如果不存在）
     */
    private function createRenewalReminderIfNotExists($project, $scheduledAt, $daysBefore, $dryRun = false)
    {
        if (AutomationTask::hasPendingTask(
            AutomationTask::TYPE_RENEWAL_REMINDER,
            $project->customer_id,
            $project->id,
            $scheduledAt->toDateString()
        )) {
            return 'exists';
        }

        $payload = [
            'customer_name' => $project->customer->name,
            'company_name' => $project->customer->company_name,
            'project_name' => $project->projectName,
            'end_day' => $project->end_day,
            'days_before' => $daysBefore,
            'message' => $this->generateRenewalReminderMessage($project, $daysBefore),
        ];

        if ($dryRun) {
            $this->line("  [DRY RUN] 續約提醒：{$project->customer->name} - {$scheduledAt->toDateString()} ({$daysBefore}天前)");
            return 'created';
        }

        AutomationTask::createRenewalReminder(
            $project->customer_id,
            $project->id,
            $scheduledAt,
            $payload
        );

        $this->line("  建立續約提醒：{$project->customer->name} - {$scheduledAt->toDateString()} ({$daysBefore}天前)");

        return 'created';
    }

    /**
     * 生成繳費提醒訊息
     */
    private function generatePaymentReminderMessage($project, $daysBefore)
    {
        $customerName = $project->customer->name;
        $companyName = $project->customer->company_name ?: '';
        $amount = number_format($project->current_payment);
        $payDay = Carbon::parse($project->next_pay_day)->format('Y/m/d');

        return "【繳費提醒】\n\n"
            . "親愛的 {$customerName} 您好，\n\n"
            . ($companyName ? "貴公司 {$companyName} 的" : "您的")
            . "租約繳費日即將到來。\n\n"
            . "📅 繳費日期：{$payDay}\n"
            . "💰 應繳金額：NT\$ {$amount}\n\n"
            . "請於繳費日前完成繳款，如有任何問題歡迎與我們聯繫。\n\n"
            . "Hour Jungle 敬上";
    }

    /**
     * 生成續約提醒訊息
     */
    private function generateRenewalReminderMessage($project, $daysBefore)
    {
        $customerName = $project->customer->name;
        $companyName = $project->customer->company_name ?: '';
        $endDay = Carbon::parse($project->end_day)->format('Y/m/d');

        return "【續約提醒】\n\n"
            . "親愛的 {$customerName} 您好，\n\n"
            . ($companyName ? "貴公司 {$companyName} 的" : "您的")
            . "租約即將到期。\n\n"
            . "📅 到期日期：{$endDay}\n"
            . "⏰ 剩餘天數：{$daysBefore} 天\n\n"
            . "如需續約，請盡早與我們聯繫，以便為您保留位置。\n\n"
            . "Hour Jungle 敬上";
    }
}
