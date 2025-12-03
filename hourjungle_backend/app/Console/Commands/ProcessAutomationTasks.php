<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AutomationTask;
use App\Models\Customer;
use App\Services\LineMessagingService;
use Illuminate\Support\Facades\Log;

/**
 * 執行自動化任務（繳費/續約提醒）
 * 排程：每日執行一次
 */
class ProcessAutomationTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'automation:process
                            {--dry-run : 只顯示會執行的任務，不實際發送}
                            {--limit=100 : 每次執行的任務數量上限}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '執行到期的自動化任務（繳費提醒、續約提醒）';

    protected LineMessagingService $lineService;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $limit = (int) $this->option('limit');

        $this->info('====================================');
        $this->info('自動化任務處理程序');
        $this->info('====================================');

        if ($dryRun) {
            $this->warn('>> DRY RUN 模式 - 不會實際發送訊息');
        }

        // 初始化 LINE 服務
        $this->lineService = new LineMessagingService();

        // 取得待執行的任務
        $tasks = AutomationTask::where('status', AutomationTask::STATUS_PENDING)
            ->where('scheduled_at', '<=', now())
            ->with(['customer', 'project'])
            ->orderBy('scheduled_at')
            ->limit($limit)
            ->get();

        $this->info("找到 {$tasks->count()} 個待執行任務");

        if ($tasks->isEmpty()) {
            $this->info('沒有需要執行的任務');
            return Command::SUCCESS;
        }

        $successCount = 0;
        $failCount = 0;
        $skipCount = 0;

        foreach ($tasks as $task) {
            $this->line('');
            $this->info("處理任務 #{$task->id}");
            $this->line("  類型：{$task->task_type_label}");
            $this->line("  客戶：{$task->customer?->name} ({$task->customer?->company_name})");
            $this->line("  排程時間：{$task->scheduled_at}");

            // 檢查客戶是否有 LINE ID
            $customer = $task->customer;
            if (!$customer || !$customer->line_id) {
                $this->warn("  >> 跳過：客戶沒有 LINE ID");
                if (!$dryRun) {
                    $task->markAsFailed('客戶沒有 LINE ID');
                }
                $skipCount++;
                continue;
            }

            // 取得訊息內容
            $message = $task->payload['message'] ?? null;
            if (!$message) {
                $this->warn("  >> 跳過：沒有訊息內容");
                if (!$dryRun) {
                    $task->markAsFailed('訊息內容為空');
                }
                $skipCount++;
                continue;
            }

            $this->line("  LINE ID：{$customer->line_id}");
            $this->line("  訊息長度：" . strlen($message) . " 字");

            if ($dryRun) {
                $this->info("  >> DRY RUN：會發送訊息給 {$customer->line_id}");
                $successCount++;
                continue;
            }

            // 發送 LINE 訊息
            $result = $this->lineService->pushMessage($customer->line_id, $message);

            if ($result['success']) {
                $task->markAsExecuted(json_encode([
                    'sent_at' => now()->toIso8601String(),
                    'line_user_id' => $customer->line_id,
                    'response' => $result['response'],
                ]));
                $this->info("  >> 發送成功");
                $successCount++;

                Log::info('自動化任務執行成功', [
                    'task_id' => $task->id,
                    'task_type' => $task->task_type,
                    'customer_id' => $task->customer_id,
                    'line_id' => $customer->line_id,
                ]);
            } else {
                $task->markAsFailed($result['error']);
                $this->error("  >> 發送失敗：{$result['error']}");
                $failCount++;

                Log::error('自動化任務執行失敗', [
                    'task_id' => $task->id,
                    'task_type' => $task->task_type,
                    'customer_id' => $task->customer_id,
                    'error' => $result['error'],
                ]);
            }

            // 避免 API 限流，每次發送後等待 100ms
            usleep(100000);
        }

        $this->line('');
        $this->info('====================================');
        $this->info('執行結果摘要');
        $this->info('====================================');
        $this->line("成功：{$successCount}");
        $this->line("失敗：{$failCount}");
        $this->line("跳過：{$skipCount}");

        return Command::SUCCESS;
    }
}
