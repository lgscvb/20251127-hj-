<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

/**
 * 自動化任務 Model
 * 用於管理繳費提醒、續約提醒等自動化通知
 */
class AutomationTask extends Model
{
    use SoftDeletes;

    protected $table = 'automation_tasks';

    // 任務類型常數
    const TYPE_PAYMENT_REMINDER = 'payment_reminder';   // 繳費提醒
    const TYPE_RENEWAL_REMINDER = 'renewal_reminder';   // 續約提醒

    // 狀態常數
    const STATUS_PENDING = 'pending';
    const STATUS_EXECUTED = 'executed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';

    // 通知管道
    const CHANNEL_LINE = 'line';
    const CHANNEL_EMAIL = 'email';
    const CHANNEL_SMS = 'sms';

    protected $fillable = [
        'task_type',
        'customer_id',
        'project_id',
        'scheduled_at',
        'executed_at',
        'status',
        'channel',
        'payload',
        'result',
        'retry_count',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'executed_at' => 'datetime',
        'payload' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 關聯：客戶
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * 關聯：合約
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * 取得待執行的任務
     */
    public static function getPendingTasks()
    {
        return self::where('status', self::STATUS_PENDING)
            ->where('scheduled_at', '<=', Carbon::now())
            ->orderBy('scheduled_at')
            ->get();
    }

    /**
     * 取得特定客戶的待執行任務
     */
    public static function getPendingTasksForCustomer($customerId)
    {
        return self::where('status', self::STATUS_PENDING)
            ->where('customer_id', $customerId)
            ->orderBy('scheduled_at')
            ->get();
    }

    /**
     * 建立繳費提醒任務
     */
    public static function createPaymentReminder($customerId, $projectId, $scheduledAt, $payload = [])
    {
        return self::create([
            'task_type' => self::TYPE_PAYMENT_REMINDER,
            'customer_id' => $customerId,
            'project_id' => $projectId,
            'scheduled_at' => $scheduledAt,
            'status' => self::STATUS_PENDING,
            'channel' => self::CHANNEL_LINE,
            'payload' => $payload,
        ]);
    }

    /**
     * 建立續約提醒任務
     */
    public static function createRenewalReminder($customerId, $projectId, $scheduledAt, $payload = [])
    {
        return self::create([
            'task_type' => self::TYPE_RENEWAL_REMINDER,
            'customer_id' => $customerId,
            'project_id' => $projectId,
            'scheduled_at' => $scheduledAt,
            'status' => self::STATUS_PENDING,
            'channel' => self::CHANNEL_LINE,
            'payload' => $payload,
        ]);
    }

    /**
     * 標記為已執行
     */
    public function markAsExecuted($result = null)
    {
        $this->update([
            'status' => self::STATUS_EXECUTED,
            'executed_at' => Carbon::now(),
            'result' => $result,
        ]);
    }

    /**
     * 標記為失敗
     */
    public function markAsFailed($result = null)
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'executed_at' => Carbon::now(),
            'result' => $result,
            'retry_count' => $this->retry_count + 1,
        ]);
    }

    /**
     * 取消任務
     */
    public function cancel()
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
        ]);
    }

    /**
     * 檢查是否已有相同的待執行任務
     */
    public static function hasPendingTask($taskType, $customerId, $projectId, $scheduledDate)
    {
        return self::where('task_type', $taskType)
            ->where('customer_id', $customerId)
            ->where('project_id', $projectId)
            ->where('status', self::STATUS_PENDING)
            ->whereDate('scheduled_at', $scheduledDate)
            ->exists();
    }

    /**
     * 取得任務類型的中文名稱
     */
    public function getTaskTypeLabelAttribute()
    {
        return match($this->task_type) {
            self::TYPE_PAYMENT_REMINDER => '繳費提醒',
            self::TYPE_RENEWAL_REMINDER => '續約提醒',
            default => $this->task_type,
        };
    }

    /**
     * 取得狀態的中文名稱
     */
    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            self::STATUS_PENDING => '待執行',
            self::STATUS_EXECUTED => '已執行',
            self::STATUS_FAILED => '失敗',
            self::STATUS_CANCELLED => '已取消',
            default => $this->status,
        };
    }
}
