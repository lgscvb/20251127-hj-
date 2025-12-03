<?php

namespace App\Http\Controllers;

use App\Models\AutomationTask;
use App\Models\Customer;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * 自動化任務 Controller
 * 管理繳費提醒、續約提醒等自動化通知
 */
class AutomationController extends Controller
{
    /**
     * 取得任務列表
     */
    public function index(Request $request)
    {
        $query = AutomationTask::with(['customer', 'project']);

        // 篩選條件
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('task_type')) {
            $query->where('task_type', $request->task_type);
        }
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $tasks = $query->orderBy('scheduled_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => true,
            'data' => $tasks,
        ]);
    }

    /**
     * 取得單一任務
     */
    public function show($id)
    {
        $task = AutomationTask::with(['customer', 'project'])->find($id);

        if (!$task) {
            return response()->json([
                'status' => false,
                'message' => '找不到任務',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $task,
        ]);
    }

    /**
     * 手動建立任務
     */
    public function store(Request $request)
    {
        $request->validate([
            'task_type' => 'required|in:payment_reminder,renewal_reminder',
            'customer_id' => 'required|exists:customers,id',
            'project_id' => 'nullable|exists:projects,id',
            'scheduled_at' => 'required|date',
            'channel' => 'nullable|in:line,email,sms',
            'payload' => 'nullable|array',
        ]);

        $task = AutomationTask::create([
            'task_type' => $request->task_type,
            'customer_id' => $request->customer_id,
            'project_id' => $request->project_id,
            'scheduled_at' => $request->scheduled_at,
            'status' => AutomationTask::STATUS_PENDING,
            'channel' => $request->channel ?? AutomationTask::CHANNEL_LINE,
            'payload' => $request->payload,
        ]);

        return response()->json([
            'status' => true,
            'message' => '任務建立成功',
            'data' => $task,
        ]);
    }

    /**
     * 取消任務
     */
    public function cancel($id)
    {
        $task = AutomationTask::find($id);

        if (!$task) {
            return response()->json([
                'status' => false,
                'message' => '找不到任務',
            ], 404);
        }

        if ($task->status !== AutomationTask::STATUS_PENDING) {
            return response()->json([
                'status' => false,
                'message' => '只能取消待執行的任務',
            ], 400);
        }

        $task->cancel();

        return response()->json([
            'status' => true,
            'message' => '任務已取消',
        ]);
    }

    /**
     * 掃描並建立提醒任務（由排程呼叫）
     */
    public function scanAndCreateTasks()
    {
        $today = Carbon::today();
        $created = [
            'payment_reminders' => 0,
            'renewal_reminders' => 0,
        ];

        // 取得所有活躍合約
        $activeProjects = Project::where('status', 1)
            ->with('customer')
            ->get();

        foreach ($activeProjects as $project) {
            if (!$project->customer || !$project->customer->line_id) {
                continue; // 跳過沒有 LINE ID 的客戶
            }

            // === 繳費提醒 ===
            // 規則：下次繳費日前 7 天和 3 天
            if ($project->next_pay_day) {
                $nextPayDay = Carbon::parse($project->next_pay_day);

                // 7 天前提醒
                $reminderDate7 = $nextPayDay->copy()->subDays(7);
                if ($reminderDate7->isToday() || $reminderDate7->isFuture()) {
                    $this->createPaymentReminderIfNotExists($project, $reminderDate7, 7);
                    $created['payment_reminders']++;
                }

                // 3 天前提醒
                $reminderDate3 = $nextPayDay->copy()->subDays(3);
                if ($reminderDate3->isToday() || $reminderDate3->isFuture()) {
                    $this->createPaymentReminderIfNotExists($project, $reminderDate3, 3);
                    $created['payment_reminders']++;
                }
            }

            // === 續約提醒 ===
            // 規則：合約到期日前 60 天和 30 天
            if ($project->end_day) {
                $endDay = Carbon::parse($project->end_day);

                // 60 天前提醒
                $reminderDate60 = $endDay->copy()->subDays(60);
                if ($reminderDate60->isToday() || $reminderDate60->isFuture()) {
                    $this->createRenewalReminderIfNotExists($project, $reminderDate60, 60);
                    $created['renewal_reminders']++;
                }

                // 30 天前提醒
                $reminderDate30 = $endDay->copy()->subDays(30);
                if ($reminderDate30->isToday() || $reminderDate30->isFuture()) {
                    $this->createRenewalReminderIfNotExists($project, $reminderDate30, 30);
                    $created['renewal_reminders']++;
                }
            }
        }

        return response()->json([
            'status' => true,
            'message' => '任務掃描完成',
            'data' => $created,
        ]);
    }

    /**
     * 建立繳費提醒（如果不存在）
     */
    private function createPaymentReminderIfNotExists($project, $scheduledAt, $daysBefore)
    {
        if (AutomationTask::hasPendingTask(
            AutomationTask::TYPE_PAYMENT_REMINDER,
            $project->customer_id,
            $project->id,
            $scheduledAt->toDateString()
        )) {
            return; // 已存在相同任務
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

        AutomationTask::createPaymentReminder(
            $project->customer_id,
            $project->id,
            $scheduledAt,
            $payload
        );

        Log::info("建立繳費提醒任務", [
            'customer_id' => $project->customer_id,
            'project_id' => $project->id,
            'scheduled_at' => $scheduledAt,
            'days_before' => $daysBefore,
        ]);
    }

    /**
     * 建立續約提醒（如果不存在）
     */
    private function createRenewalReminderIfNotExists($project, $scheduledAt, $daysBefore)
    {
        if (AutomationTask::hasPendingTask(
            AutomationTask::TYPE_RENEWAL_REMINDER,
            $project->customer_id,
            $project->id,
            $scheduledAt->toDateString()
        )) {
            return; // 已存在相同任務
        }

        $payload = [
            'customer_name' => $project->customer->name,
            'company_name' => $project->customer->company_name,
            'project_name' => $project->projectName,
            'end_day' => $project->end_day,
            'days_before' => $daysBefore,
            'message' => $this->generateRenewalReminderMessage($project, $daysBefore),
        ];

        AutomationTask::createRenewalReminder(
            $project->customer_id,
            $project->id,
            $scheduledAt,
            $payload
        );

        Log::info("建立續約提醒任務", [
            'customer_id' => $project->customer_id,
            'project_id' => $project->id,
            'scheduled_at' => $scheduledAt,
            'days_before' => $daysBefore,
        ]);
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

    /**
     * 取得統計資訊
     */
    public function stats()
    {
        $pending = AutomationTask::where('status', AutomationTask::STATUS_PENDING)->count();
        $todayPending = AutomationTask::where('status', AutomationTask::STATUS_PENDING)
            ->whereDate('scheduled_at', Carbon::today())
            ->count();
        $executedToday = AutomationTask::where('status', AutomationTask::STATUS_EXECUTED)
            ->whereDate('executed_at', Carbon::today())
            ->count();
        $failedToday = AutomationTask::where('status', AutomationTask::STATUS_FAILED)
            ->whereDate('executed_at', Carbon::today())
            ->count();

        return response()->json([
            'status' => true,
            'data' => [
                'pending_total' => $pending,
                'today_pending' => $todayPending,
                'today_executed' => $executedToday,
                'today_failed' => $failedToday,
            ],
        ]);
    }
}
