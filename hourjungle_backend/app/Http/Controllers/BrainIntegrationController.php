<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Project;
use App\Models\PaymentHistory;
use App\Http\Controllers\Traits\ApiHelperTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Brain AI 系統整合 Controller
 *
 * 提供給 Brain 系統調用的 API 端點
 * 用於查詢客戶資料、合約狀態、繳費記錄等
 */
class BrainIntegrationController extends Controller
{
    use ApiHelperTrait;

    /**
     * 透過 LINE userId 查詢客戶資料
     *
     * @param string $lineUserId LINE 用戶 ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCustomerByLineId($lineUserId)
    {
        try {
            // 透過 line_id 查詢客戶
            $customer = Customer::where('line_id', $lineUserId)->first();

            if (!$customer) {
                return response()->json([
                    'status' => false,
                    'message' => '找不到客戶',
                    'data' => null
                ], 404);
            }

            // 取得客戶的合約
            $contracts = Project::where('customer_id', $customer->id)
                ->with(['businessItem', 'branch'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($project) {
                    return [
                        'id' => $project->id,
                        'project_name' => $project->projectName,
                        'contract_type' => $project->contractType,
                        'start_day' => $project->start_day?->format('Y-m-d'),
                        'end_day' => $project->end_day?->format('Y-m-d'),
                        'status' => $this->getContractStatusText($project->status),
                        'next_pay_day' => $project->next_pay_day?->format('Y-m-d'),
                        'current_payment' => $project->current_payment,
                        'business_item' => $project->businessItem?->name,
                        'branch' => $project->branch?->name,
                    ];
                });

            // 計算繳費狀態
            $paymentStatus = $this->calculatePaymentStatus($customer->id);

            return response()->json([
                'status' => true,
                'message' => '查詢成功',
                'data' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                    'company_name' => $customer->company_name,
                    'company_number' => $customer->company_number,
                    'line_id' => $customer->line_id,
                    'line_nickname' => $customer->line_nickname,
                    'contracts' => $contracts,
                    'payment_status' => $paymentStatus,
                    'created_at' => $customer->created_at?->format('Y-m-d H:i:s'),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Brain Integration - getCustomerByLineId error', [
                'line_user_id' => $lineUserId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => false,
                'message' => '查詢失敗：' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * 取得客戶的所有合約
     *
     * @param string $lineUserId LINE 用戶 ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCustomerContracts($lineUserId)
    {
        try {
            $customer = Customer::where('line_id', $lineUserId)->first();

            if (!$customer) {
                return response()->json([
                    'status' => false,
                    'message' => '找不到客戶',
                    'data' => []
                ], 404);
            }

            $contracts = Project::where('customer_id', $customer->id)
                ->with(['businessItem', 'branch', 'member'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($project) {
                    return [
                        'id' => $project->id,
                        'project_name' => $project->projectName,
                        'contract_type' => $project->contractType,
                        'start_day' => $project->start_day?->format('Y-m-d'),
                        'end_day' => $project->end_day?->format('Y-m-d'),
                        'signing_day' => $project->signing_day?->format('Y-m-d'),
                        'status' => $this->getContractStatusText($project->status),
                        'contract_status' => $this->getContractApprovalStatus($project->contract_status),
                        'next_pay_day' => $project->next_pay_day?->format('Y-m-d'),
                        'last_pay_day' => $project->last_pay_day?->format('Y-m-d'),
                        'pay_day' => $project->pay_day,
                        'payment_period' => $project->payment_period,
                        'original_price' => $project->original_price,
                        'sale_price' => $project->sale_price,
                        'current_payment' => $project->current_payment,
                        'total_payment' => $project->total_payment,
                        'deposit' => $project->deposit,
                        'business_item' => $project->businessItem?->name,
                        'branch' => $project->branch?->name,
                        'sales_person' => $project->member?->nickname,
                        'remark' => $project->remark,
                    ];
                });

            return response()->json([
                'status' => true,
                'message' => '查詢成功',
                'data' => $contracts
            ]);

        } catch (\Exception $e) {
            Log::error('Brain Integration - getCustomerContracts error', [
                'line_user_id' => $lineUserId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => false,
                'message' => '查詢失敗',
                'data' => []
            ], 500);
        }
    }

    /**
     * 取得客戶的繳費記錄
     *
     * @param string $lineUserId LINE 用戶 ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCustomerPayments($lineUserId)
    {
        try {
            $customer = Customer::where('line_id', $lineUserId)->first();

            if (!$customer) {
                return response()->json([
                    'status' => false,
                    'message' => '找不到客戶',
                    'data' => []
                ], 404);
            }

            $payments = PaymentHistory::where('customer_id', $customer->id)
                ->with(['project', 'branch'])
                ->orderBy('pay_day', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'pay_day' => $payment->pay_day?->format('Y-m-d'),
                        'pay_type' => $payment->pay_type,
                        'amount' => $payment->amount,
                        'project_name' => $payment->project?->projectName,
                        'branch' => $payment->branch?->name,
                        'remark' => $payment->remark,
                    ];
                });

            return response()->json([
                'status' => true,
                'message' => '查詢成功',
                'data' => $payments
            ]);

        } catch (\Exception $e) {
            Log::error('Brain Integration - getCustomerPayments error', [
                'line_user_id' => $lineUserId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => false,
                'message' => '查詢失敗',
                'data' => []
            ], 500);
        }
    }

    /**
     * 建立潛在客戶（從 Brain 轉交）
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createLead(Request $request)
    {
        try {
            $lineUserId = $request->input('line_user_id');
            $displayName = $request->input('display_name', '');
            $inquiryType = $request->input('inquiry_type', 'general');
            $notes = $request->input('notes', '');

            // 檢查是否已存在
            $existingCustomer = Customer::where('line_id', $lineUserId)->first();
            if ($existingCustomer) {
                return response()->json([
                    'status' => true,
                    'message' => '客戶已存在',
                    'data' => [
                        'id' => $existingCustomer->id,
                        'name' => $existingCustomer->name,
                        'is_new' => false
                    ]
                ]);
            }

            // 建立新客戶
            $customer = Customer::create([
                'name' => $displayName ?: 'LINE 用戶',
                'line_id' => $lineUserId,
                'line_nickname' => $displayName,
                'remark' => "[Brain 轉入] 詢問類型: {$inquiryType}\n{$notes}",
                'status' => 1,
            ]);

            Log::info('Brain Integration - Created new lead', [
                'customer_id' => $customer->id,
                'line_user_id' => $lineUserId,
                'inquiry_type' => $inquiryType
            ]);

            return response()->json([
                'status' => true,
                'message' => '建立成功',
                'data' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'is_new' => true
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Brain Integration - createLead error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'status' => false,
                'message' => '建立失敗：' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * 記錄互動（從 Brain 通知）
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function recordInteraction(Request $request)
    {
        try {
            $lineUserId = $request->input('line_user_id');
            $interactionType = $request->input('interaction_type', 'message');
            $content = $request->input('content', '');

            $customer = Customer::where('line_id', $lineUserId)->first();

            if ($customer) {
                // 更新備註，記錄最後互動
                $timestamp = now()->format('Y-m-d H:i:s');
                $newRemark = "[{$timestamp}] {$interactionType}: {$content}\n" . ($customer->remark ?? '');

                // 限制備註長度
                if (strlen($newRemark) > 5000) {
                    $newRemark = substr($newRemark, 0, 5000);
                }

                $customer->update(['remark' => $newRemark]);

                Log::info('Brain Integration - Recorded interaction', [
                    'customer_id' => $customer->id,
                    'interaction_type' => $interactionType
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => '記錄成功'
            ]);

        } catch (\Exception $e) {
            Log::error('Brain Integration - recordInteraction error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => false,
                'message' => '記錄失敗'
            ], 500);
        }
    }

    /**
     * 取得合約狀態文字
     */
    private function getContractStatusText($status)
    {
        return match ($status) {
            1 => 'active',
            0 => 'inactive',
            2 => 'expired',
            3 => 'terminated',
            default => 'unknown'
        };
    }

    /**
     * 取得合約審核狀態
     */
    private function getContractApprovalStatus($status)
    {
        return match ($status) {
            0 => 'pending',
            1 => 'reviewing',
            2 => 'approved',
            3 => 'rejected',
            default => 'unknown'
        };
    }

    /**
     * 計算客戶的繳費狀態
     */
    private function calculatePaymentStatus($customerId)
    {
        $today = now();

        // 檢查是否有逾期的合約
        $overdueProjects = Project::where('customer_id', $customerId)
            ->where('status', 1) // 有效合約
            ->whereNotNull('next_pay_day')
            ->where('next_pay_day', '<', $today)
            ->get();

        if ($overdueProjects->count() > 0) {
            $totalOverdue = $overdueProjects->sum('current_payment');
            return [
                'overdue' => true,
                'overdue_count' => $overdueProjects->count(),
                'overdue_amount' => $totalOverdue,
            ];
        }

        // 檢查即將到期（7天內）
        $upcomingProjects = Project::where('customer_id', $customerId)
            ->where('status', 1)
            ->whereNotNull('next_pay_day')
            ->whereBetween('next_pay_day', [$today, $today->copy()->addDays(7)])
            ->first();

        if ($upcomingProjects) {
            return [
                'overdue' => false,
                'upcoming' => true,
                'upcoming_date' => $upcomingProjects->next_pay_day->format('Y-m-d'),
                'upcoming_amount' => $upcomingProjects->current_payment,
            ];
        }

        return [
            'overdue' => false,
            'upcoming' => false,
        ];
    }
}
