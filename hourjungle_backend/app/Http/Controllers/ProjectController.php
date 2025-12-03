<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Customer;
use App\Models\BusinessItem;
use App\Models\Branch;
use App\Models\PaymentHistory;
use App\Http\Controllers\Traits\ApiHelperTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProjectsExport;

/**
 * 專案/合約管理 Controller
 *
 * 處理合約 CRUD、繳費歷程及匯入匯出功能
 */
class ProjectController extends Controller
{
    use ApiHelperTrait;

    /**
     * 新增合約
     */
    public function createProject(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $validator = Validator::make($request->all(), [
                'projectName' => 'required',
                'business_item_id' => 'required|integer',
                'customer_id' => 'required|integer',
                'start_day' => 'required|date',
                'end_day' => 'required|date',
                'signing_day' => 'required|date',
                'pay_day' => 'required|integer|min:1|max:31',
                'payment_period' => 'required|integer',
                'contractType' => 'required',
                'sale_price' => 'required|numeric|min:0',
                'original_price' => 'required|numeric|min:0',
                'deposit' => 'required|numeric|min:0',
                'penaltyFee' => 'required|numeric|min:0',
                'lateFee' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return $this->errorResponse($validator->errors()->first());
            }

            $businessItem = BusinessItem::find($request->business_item_id);
            if (!$businessItem) {
                return $this->errorResponse('業務項目不存在');
            }

            $customer = Customer::find($request->customer_id);
            if (!$customer) {
                return $this->errorResponse('客戶不存在');
            }

            $project = new Project();
            $project->fill([
                'projectName' => $request->projectName,
                'business_item_id' => $request->business_item_id,
                'customer_id' => $request->customer_id,
                'member_id' => $member->id,
                'branch_id' => $member->branch_id,
                'start_day' => $request->start_day,
                'end_day' => $request->end_day,
                'signing_day' => $request->signing_day,
                'pay_day' => $request->pay_day,
                'payment_period' => $request->payment_period,
                'contractType' => $request->contractType,
                'original_price' => $request->original_price,
                'sale_price' => $request->sale_price,
                'current_payment' => $request->current_payment,
                'total_payment' => $request->total_payment,
                'next_pay_day' => $request->next_pay_day,
                'last_pay_day' => $request->last_pay_day,
                'contract_status' => $request->contract_status ?? 0,
                'penaltyFee' => $request->penaltyFee,
                'deposit' => $request->deposit,
                'lateFee' => $request->lateFee,
                'status' => $request->status ?? 1,
                'broker' => $request->broker,
                'broker_remark' => $request->broker_remark,
                'remark' => $request->remark
            ]);
            $project->save();

            $systemlog_description = '[新增合約] 合約名稱:' . $project->projectName .
                ' 業務項目:' . $businessItem->name .
                ' 客戶:' . $customer->name .
                ' 開始日期:' . $project->start_day .
                ' 結束日期:' . $project->end_day .
                ' 簽約日期:' . $project->signing_day .
                ' 繳費日:' . $project->pay_day .
                ' 付款方案:' . $project->payment_period .
                ' 合約類型:' . $project->contractType .
                ' 原價:' . $project->original_price .
                ' 售價:' . $project->sale_price .
                ' 押金:' . $project->deposit .
                ' 違約金:' . $project->penaltyFee .
                ' 滯納金:' . $project->lateFee .
                ' 狀態:' . $project->status .
                ' 備註:' . $project->remark;
            $this->createSystemLog($member->id, '新增', $systemlog_description, 'projects', $project->id, 'create');

            return $this->successResponse('新增成功', $project);
        } catch (\Exception $e) {
            \Log::error('Create project error: ' . $e->getMessage());
            return $this->errorResponse('新增失敗：' . $e->getMessage());
        }
    }

    /**
     * 修改合約
     */
    public function updateProject(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $project = Project::find($request->id);
            if (!$project) {
                return $this->errorResponse('合約不存在');
            }

            if (empty($request->business_item_id)) {
                return $this->errorResponse('業務項目ID不能為空');
            }
            $businessItem = BusinessItem::find($request->business_item_id);
            if (!$businessItem) {
                return $this->errorResponse('業務項目不存在');
            }

            if (empty($request->customer_id)) {
                return $this->errorResponse('客戶ID不能為空');
            }
            $customer = Customer::find($request->customer_id);
            if (!$customer) {
                return $this->errorResponse('客戶不存在');
            }

            if (empty($request->start_day)) {
                return $this->errorResponse('開始日期不能為空');
            }
            if (empty($request->end_day)) {
                return $this->errorResponse('合約到期日不能為空');
            }
            if (empty($request->signing_day)) {
                return $this->errorResponse('簽約日期不能為空');
            }
            if (empty($request->pay_day)) {
                return $this->errorResponse('約定繳費日不能為空');
            }
            if (empty($request->payment_period)) {
                return $this->errorResponse('付款方案不能為空');
            }

            // 根據付款方案設定 cp 值
            $cp = 1;
            switch ($request->payment_period) {
                case 1: $cp = 1; break;  // 月繳
                case 2: $cp = 3; break;  // 季繳
                case 3: $cp = 6; break;  // 半年繳
                case 4: $cp = 12; break; // 年繳
            }

            $current_payment = $request->sale_price * $cp;
            $total_payment = $request->sale_price * $request->contractType * 12;

            $updateData = [
                'projectName' => $request->projectName,
                'business_item_id' => $request->business_item_id,
                'customer_id' => $customer->id,
                'member_id' => $member->id,
                'branch_id' => $member->branch_id,
                'start_day' => $request->start_day,
                'end_day' => $request->end_day,
                'signing_day' => $request->signing_day,
                'pay_day' => $request->pay_day,
                'payment_period' => $request->payment_period,
                'contractType' => $request->contractType,
                'original_price' => $request->original_price,
                'sale_price' => $request->sale_price,
                'current_payment' => $current_payment,
                'total_payment' => $total_payment,
                'next_pay_day' => $request->next_pay_day,
                'last_pay_day' => $request->last_pay_day,
                'contract_status' => $request->contract_status ?? 0,
                'penaltyFee' => $request->penaltyFee,
                'deposit' => $request->deposit,
                'lateFee' => $request->lateFee,
                'status' => $request->status ?? 1,
                'broker' => $request->broker,
                'broker_remark' => $request->broker_remark,
                'remark' => $request->remark,
                'updated_at' => now()
            ];

            $project->update($updateData);

            $systemlog_description = '[修改合約] 合約名稱:' . $project->projectName .
                ' 業務項目:' . $businessItem->name .
                ' 客戶:' . $customer->name .
                ' 開始日期:' . $project->start_day .
                ' 結束日期:' . $project->end_day .
                ' 簽約日期:' . $project->signing_day .
                ' 繳費日:' . $project->pay_day .
                ' 付款方案:' . $project->payment_period .
                ' 合約類型:' . $project->contractType .
                ' 原價:' . $project->original_price .
                ' 售價:' . $project->sale_price .
                ' 押金:' . $project->deposit .
                ' 違約金:' . $project->penaltyFee .
                ' 滯納金:' . $project->lateFee .
                ' 狀態:' . $project->status .
                ' 備註:' . $project->remark;
            $this->createSystemLog($member->id, '修改', $systemlog_description, 'projects', $project->id, 'update');

            return $this->successResponse('修改成功');
        } catch (\Exception $e) {
            \Log::error('Update project error: ' . $e->getMessage());
            return $this->errorResponse('修改失敗：' . $e->getMessage());
        }
    }

    /**
     * 刪除合約
     */
    public function deleteProject(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $project = Project::find($request->id);
            if (!$project) {
                return $this->errorResponse('合約不存在');
            }

            $project->delete();

            $systemlog_description = '[刪除合約] 合約名稱:' . $project->projectName .
                ' 業務項目:' . $project->businessItem->name .
                ' 客戶:' . $project->customer->name;
            $this->createSystemLog($member->id, '刪除', $systemlog_description, 'projects', $project->id, 'delete');

            return $this->successResponse('刪除成功');
        } catch (\Exception $e) {
            \Log::error('Delete project error: ' . $e->getMessage());
            return $this->errorResponse('刪除失敗：' . $e->getMessage());
        }
    }

    /**
     * 取得合約列表
     */
    public function getProjectList(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $keyword = $request->get('keyword');
            $branchId = $request->get('branch_id');

            $query = Project::with([
                'businessItem:id,name',
                'customer',
                'branch:id,name'
            ]);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            if ($keyword) {
                $query->where(function ($q) use ($keyword) {
                    $q->whereHas('customer', function ($query) use ($keyword) {
                        $query->where('name', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('customer', function ($query) use ($keyword) {
                        $query->where('company_name', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('businessItem', function ($query) use ($keyword) {
                        $query->where('name', 'like', "%{$keyword}%");
                    })
                    ->orWhere('remark', 'like', "%{$keyword}%");
                });
            }

            $projects = $query->paginate($perPage);

            $projects->getCollection()->transform(function ($project) {
                $customer = $project->customer;
                return [
                    'id' => $project->id,
                    'projectName' => $project->projectName,
                    'businessItemName' => $project->businessItem->name ?? '未知業務項目',
                    'business_item_id' => $project->business_item_id,
                    'customerName' => $customer->name ?? '未知客戶',
                    'customer_id' => $project->customer_id,
                    'line_id' => $customer->line_id ?? null,
                    'line_nickname' => $customer->line_nickname ?? null,
                    'member_id' => $project->member_id,
                    'branchName' => $project->branch->name ?? '未知分館',
                    'branch_id' => $project->branch_id,
                    'start_day' => $project->start_day,
                    'end_day' => $project->end_day,
                    'signing_day' => $project->signing_day,
                    'contractType' => $project->contractType,
                    'pay_day' => $project->pay_day,
                    'payment_period' => $project->payment_period,
                    'original_price' => $project->original_price,
                    'sale_price' => $project->sale_price,
                    'current_payment' => $project->current_payment,
                    'total_payment' => $project->total_payment,
                    'next_pay_day' => $project->next_pay_day,
                    'last_pay_day' => $project->last_pay_day,
                    'contract_status' => $project->contract_status,
                    'penaltyFee' => $project->penaltyFee,
                    'deposit' => $project->deposit,
                    'lateFee' => $project->lateFee,
                    'status' => $project->status,
                    'broker' => $project->broker,
                    'broker_remark' => $project->broker_remark,
                    'remark' => $project->remark,
                    'created_at' => $project->created_at,
                    'updated_at' => $project->updated_at,
                    'contract_path' => $project->contract_path,
                ];
            });

            return response()->json([
                'status' => true,
                'message' => 'success',
                'data' => $projects->items(),
                'current_page' => $projects->currentPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total()
            ]);

        } catch (\Exception $e) {
            \Log::error('Get project list error: ' . $e->getMessage());
            return $this->errorResponse('獲取失敗：' . $e->getMessage(), 500);
        }
    }

    /**
     * 取得合約內容
     */
    public function getProjectInfo(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $project = Project::with(['customer', 'businessItem', 'branch'])
                ->find($request->id);

            if (!$project) {
                return $this->errorResponse('合約不存在');
            }

            if (!$member->is_top_account && $member->branch_id !== $project->branch_id) {
                return $this->errorResponse('無權限查看此專案', 403);
            }

            $data = [
                'id' => $project->id,
                'projectName' => $project->projectName,
                'businessItemName' => $project->businessItem->name,
                'business_item_id' => $project->businessItem->id,
                'customerName' => $project->customer->name,
                'customer_id' => $project->customer->id,
                'member_id' => $project->member_id,
                'branchName' => $project->branch->name,
                'branch_id' => $project->branch->id,
                'start_day' => $project->start_day,
                'end_day' => $project->end_day,
                'signing_day' => $project->signing_day,
                'pay_day' => $project->pay_day,
                'contractType' => $project->contractType,
                'payment_period' => $project->payment_period,
                'sale_price' => $project->sale_price,
                'original_price' => $project->original_price,
                'current_payment' => $project->current_payment,
                'total_payment' => $project->total_payment,
                'next_pay_day' => $project->next_pay_day,
                'last_pay_day' => $project->last_pay_day,
                'contract_status' => $project->contract_status,
                'penaltyFee' => $project->penaltyFee,
                'deposit' => $project->deposit,
                'lateFee' => $project->lateFee,
                'status' => $project->status,
                'broker' => $project->broker,
                'broker_remark' => $project->broker_remark,
                'remark' => $project->remark,
                'created_at' => $project->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $project->updated_at->format('Y-m-d H:i:s')
            ];

            return $this->successResponse('獲取成功', $data);
        } catch (\Exception $e) {
            \Log::error('Get project info error: ' . $e->getMessage());
            return $this->errorResponse('獲取失敗：' . $e->getMessage(), 500);
        }
    }

    /**
     * 公開的合約資料 API
     */
    public function getPublicProjectInfo($projectId)
    {
        try {
            $project = Project::with(['customer', 'businessItem', 'branch'])
                ->where('id', $projectId)
                ->first();

            if (!$project) {
                return $this->errorResponse('找不到專案');
            }

            $data = [
                'id' => $project->id,
                'projectName' => $project->projectName,
                'businessItemName' => $project->businessItem->name,
                'customerName' => $project->customer->name,
                'branchName' => $project->branch->name,
                'start_day' => $project->start_day,
                'end_day' => $project->end_day,
                'signing_day' => $project->signing_day,
                'pay_day' => $project->pay_day,
                'payment_period' => $project->payment_period,
                'contractType' => $project->contractType,
                'sale_price' => $project->sale_price,
                'current_payment' => $project->current_payment,
                'total_payment' => $project->total_payment,
                'deposit' => $project->deposit,
                'penaltyFee' => $project->penaltyFee,
                'lateFee' => $project->lateFee,
                'broker' => $project->broker,
                'broker_remark' => $project->broker_remark,
                'remark' => $project->remark
            ];

            return response()->json([
                'status' => true,
                'message' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('獲取合約資料失敗');
        }
    }

    // ===== 繳費歷程 =====

    /**
     * 新增繳費歷程
     */
    public function createPaymentHistory(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        if (empty($request->project_id)) {
            return $this->errorResponse('合約ID不能為空');
        }

        $project = Project::find($request->project_id);
        if (!$project) {
            return $this->errorResponse('合約不存在');
        }

        if (empty($request->pay_day)) {
            return $this->errorResponse('繳費日期不能為空');
        }

        if (empty($request->pay_type)) {
            return $this->errorResponse('繳費方式不能為空');
        }

        if (empty($request->amount)) {
            return $this->errorResponse('繳費金額不能為空');
        }

        if ($request->amount < 0) {
            return $this->errorResponse('繳費金額不能小於0');
        }

        $paymentHistory = new PaymentHistory();
        $paymentHistory->fill([
            'project_id' => $request->project_id,
            'customer_id' => $project->customer_id,
            'branch_id' => $project->branch_id,
            'pay_day' => date('Y-m-d'),
            'pay_type' => $request->pay_type,
            'amount' => $request->amount,
            'remark' => $request->remark
        ]);
        $paymentHistory->save();

        // 更新合約最後付款日期和下次付款日期
        $project->last_pay_day = date('Y-m-d');
        switch ($project->payment_period) {
            case 1:
                $project->next_pay_day = date('Y-m-d', strtotime($project->next_pay_day . ' +1 month'));
                break;
            case 2:
                $project->next_pay_day = date('Y-m-d', strtotime($project->next_pay_day . ' +3 month'));
                break;
            case 3:
                $project->next_pay_day = date('Y-m-d', strtotime($project->next_pay_day . ' +6 month'));
                break;
            case 4:
                $project->next_pay_day = date('Y-m-d', strtotime($project->next_pay_day . ' +1 year'));
                break;
        }
        $project->save();

        $customer = Customer::find($project->customer_id);
        $systemlog_description = '[新增繳費歷程] 合約名稱:' . $project->projectName .
            ' 客戶名稱:' . $customer->name .
            ' 繳費日期:' . $request->pay_day .
            ' 繳費方式:' . $request->pay_type .
            ' 繳費金額:' . $request->amount .
            ' 備註:' . $request->remark;
        $this->createSystemLog($member->id, '新增', $systemlog_description, 'payment_histories', $paymentHistory->id, 'create');

        return $this->successResponse('新增成功');
    }

    /**
     * 列出繳費歷程
     */
    public function getPaymentHistoryList(Request $request)
    {
        $paymentHistory = PaymentHistory::query()
            ->join('projects', 'payment_histories.project_id', '=', 'projects.id')
            ->join('business_items', 'projects.business_item_id', '=', 'business_items.id')
            ->join('branches', 'payment_histories.branch_id', '=', 'branches.id')
            ->join('customers', 'payment_histories.customer_id', '=', 'customers.id')
            ->select(
                'payment_histories.*',
                'projects.projectName',
                'projects.current_payment',
                'business_items.name as business_item_name',
                'branches.name as branch_name',
                'customers.name as customer_name',
                'customers.company_name as company_name'
            );

        $start_day = $request->start_day;
        $end_day = $request->end_day;
        $pay_day = $request->pay_day;
        $branch_id = $request->branch_id;
        $project_id = $request->project_id;
        $customer_id = $request->customer_id;
        $business_item_id = $request->business_item_id;
        $keyword = $request->keyword;

        if (!empty($start_day)) {
            $paymentHistory->where('payment_histories.pay_day', '>=', $start_day);
        }
        if (!empty($end_day)) {
            $paymentHistory->where('payment_histories.pay_day', '<=', $end_day);
        }
        if (!empty($pay_day)) {
            $paymentHistory->where('payment_histories.pay_day', $pay_day);
        }
        if (!empty($branch_id)) {
            $paymentHistory->where('payment_histories.branch_id', $branch_id);
        }
        if (!empty($project_id)) {
            $paymentHistory->where('payment_histories.project_id', $project_id);
        }
        if (!empty($customer_id)) {
            $paymentHistory->where('payment_histories.customer_id', $customer_id);
        }
        if (!empty($business_item_id)) {
            $paymentHistory->where('payment_histories.business_item', $business_item_id);
        }
        if (!empty($keyword)) {
            $paymentHistory->where(function ($query) use ($keyword) {
                $query->where('customers.name', 'like', "%{$keyword}%")
                    ->orWhere('customers.company_name', 'like', "%{$keyword}%")
                    ->orWhere('business_items.name', 'like', "%{$keyword}%")
                    ->orWhere('branches.name', 'like', "%{$keyword}%")
                    ->orWhere('projects.projectName', 'like', "%{$keyword}%")
                    ->orWhere('payment_histories.pay_type', 'like', "%{$keyword}%");
            });
        }

        $paymentHistory = $paymentHistory->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'project_id' => $item->project_id,
                'projectName' => $item->projectName,
                'current_payment' => $item->current_payment,
                'customer_id' => $item->customer_id,
                'customer_name' => $item->customer_name,
                'company_name' => $item->company_name,
                'branch_id' => $item->branch_id,
                'branch_name' => $item->branch_name,
                'business_item_name' => $item->business_item_name,
                'pay_day' => $item->pay_day,
                'pay_type' => $item->pay_type,
                'amount' => $item->amount,
                'remark' => $item->remark ?? '',
                'created_at' => $item->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $item->updated_at->format('Y-m-d H:i:s')
            ];
        });

        return response()->json([
            'status' => true,
            'message' => '列出成功',
            'data' => $paymentHistory
        ]);
    }

    // ===== 合約相關 =====

    /**
     * 確認合約（簽名）
     */
    public function confirmContract(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $validator = Validator::make($request->all(), [
                'project_id' => 'required|exists:projects,id',
                'signature' => 'required|string',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse($validator->errors()->first());
            }

            $project = Project::find($request->project_id);

            if (!$member->is_top_account && $member->branch_id !== $project->branch_id) {
                return $this->errorResponse('無權限確認此合約', 403);
            }

            // 儲存簽名圖片
            $signatureImage = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $request->signature));
            $signatureimg = $project->customer_id . '_' . time() . '.png';
            $signaturePath = 'signatures/' . $project->customer_id;
            if (!Storage::disk('public')->exists($signaturePath)) {
                Storage::disk('public')->makeDirectory($signaturePath);
            }
            Storage::disk('public')->put($signaturePath . '/' . $signatureimg, $signatureImage);

            $project->fill([
                'contract_status' => 1,
                'signature_path' => $signaturePath . '/' . $signatureimg,
                'confirmed_at' => now(),
                'confirmed_by' => $member->id
            ]);
            $project->save();

            return response()->json([
                'status' => true,
                'message' => '合約確認成功',
                'data' => [
                    'signature_url' => Storage::url($signaturePath)
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Confirm contract error: ' . $e->getMessage());
            return $this->errorResponse('確認失敗：' . $e->getMessage());
        }
    }

    /**
     * 上傳合約 PDF
     */
    public function uploadContractPdf(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $validator = Validator::make($request->all(), [
                'project_id' => 'required|exists:projects,id',
                'pdf_file' => 'required|string',
                'signature' => 'required|string',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse($validator->errors()->first());
            }

            $project = Project::find($request->project_id);

            if (!$member->is_top_account && $member->branch_id !== $project->branch_id) {
                return $this->errorResponse('無權限上傳此合約', 403);
            }

            // 儲存 PDF 文件
            $pdfData = base64_decode(preg_replace('#^data:application/pdf;base64,#i', '', $request->pdf_file));
            $pdf_name = $project->customer_id . '_' . time() . '.pdf';
            $pdfPath = 'contracts/' . $project->customer_id;
            if (!Storage::disk('public')->exists($pdfPath)) {
                Storage::disk('public')->makeDirectory($pdfPath);
            }
            Storage::disk('public')->put($pdfPath . '/' . $pdf_name, $pdfData);

            // 儲存簽名圖片
            $signatureImage = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $request->signature));
            $signature_name = $project->customer_id . '_' . time() . '.png';
            $signaturePath = 'signatures/' . $project->customer_id;
            if (!Storage::disk('public')->exists($signaturePath)) {
                Storage::disk('public')->makeDirectory($signaturePath);
            }
            Storage::disk('public')->put($signaturePath . '/' . $signature_name, $signatureImage);

            $project->fill([
                'contract_status' => 4,
                'contract_path' => $pdfPath . '/' . $pdf_name,
                'signature_path' => $signaturePath . '/' . $signature_name,
                'confirmed_at' => now(),
                'confirmed_by' => $member->id
            ]);
            $project->save();

            return response()->json([
                'status' => true,
                'message' => '合約上傳成功',
                'data' => [
                    'contract_url' => Storage::url($pdfPath),
                    'signature_url' => Storage::url($signaturePath)
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Upload contract error: ' . $e->getMessage());
            return $this->errorResponse('上傳失敗：' . $e->getMessage());
        }
    }

    /**
     * 下載合約
     */
    public function downloadContract($projectId)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $project = Project::find($projectId);

            if (!$member->is_top_account && $member->branch_id !== $project->branch_id) {
                return $this->errorResponse('無權限下載此合約', 403);
            }

            if (!Storage::disk('public')->exists($project->contract_path)) {
                return $this->errorResponse('合約文件不存在');
            }

            $downloadFileName = 'contract_' . $project->id . '_' . time() . '.pdf';

            return Storage::disk('public')->download(
                $project->contract_path,
                $downloadFileName
            );
        } catch (\Exception $e) {
            return $this->errorResponse('下載失敗：' . $e->getMessage());
        }
    }

    /**
     * 獲取合約 PDF
     */
    public function getContractPdf($projectId)
    {
        try {
            $project = Project::findOrFail($projectId);

            if (!$project->contract_path) {
                return $this->errorResponse('找不到合約文件路徑');
            }

            $filePath = storage_path('app/public/' . $project->contract_path);

            if (!file_exists($filePath)) {
                return $this->errorResponse('找不到合約文件');
            }

            return response()->file($filePath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="contract.pdf"'
            ]);

        } catch (\Exception $e) {
            \Log::error('Get contract PDF error: ' . $e->getMessage());
            return $this->errorResponse('獲取合約失敗：' . $e->getMessage());
        }
    }

    // ===== 匯入匯出 =====

    /**
     * 匯出專案範例
     */
    public function exportProjectsExample()
    {
        $projects = collect([
            (object)[
                'projectName' => '專案1',
                'business_item_name' => '業務項目1',
                'customer_name' => '客戶1',
                'customer_company_name' => '客戶公司1',
                'branch_name' => '台北總館',
                'start_day' => '2024-01-01',
                'end_day' => '2024-12-31',
                'signing_day' => '2024-01-01',
                'pay_day' => '5',
                'payment_period' => 1,
                'contractType' => '1',
                'original_price' => 3000,
                'sale_price' => 1800,
                'current_payment' => 1800,
                'total_payment' => 21600,
                'penaltyFee' => 6000,
                'lateFee' => '3%',
                'deposit' => 3000,
                'next_pay_day' => '2024-02-01',
                'last_pay_day' => '2024-01-01',
                'status' => '啟用',
                'contract_status' => 2,
                'broker' => '張三',
                'broker_remark' => '張三的備註',
                'remark' => '備註',
                'created_at' => now(),
                'updated_at' => now()
            ],
            (object)[
                'projectName' => '專案2',
                'business_item_name' => '業務項目2',
                'customer_name' => '客戶2',
                'customer_company_name' => '客戶公司2',
                'branch_name' => '台北總館',
                'start_day' => '2024-01-01',
                'end_day' => '2025-12-31',
                'signing_day' => '2024-01-01',
                'pay_day' => '1',
                'payment_period' => 2,
                'contractType' => '2',
                'original_price' => 3000,
                'sale_price' => 1800,
                'current_payment' => 1800,
                'total_payment' => 21600,
                'penaltyFee' => 6000,
                'lateFee' => '3%',
                'deposit' => 3000,
                'next_pay_day' => '2024-04-01',
                'last_pay_day' => '2024-01-01',
                'status' => '啟用',
                'contract_status' => 2,
                'broker' => '李四',
                'broker_remark' => '李四的備註',
                'remark' => '備註',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        return Excel::download(new ProjectsExport($projects), '專案範例.xlsx');
    }

    /**
     * 匯出專案
     */
    public function exportProjects(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $query = Project::query()
                ->leftJoin('branches', 'projects.branch_id', '=', 'branches.id')
                ->leftJoin('customers', 'projects.customer_id', '=', 'customers.id')
                ->leftJoin('business_items', 'projects.business_item_id', '=', 'business_items.id')
                ->select(
                    'projects.*',
                    'branches.name as branch_name',
                    'customers.name as customer_name',
                    'customers.company_name as customer_company_name',
                    'business_items.name as business_item_name'
                );

            if (!$member->is_top_account) {
                $query->where('projects.branch_id', $member->branch_id);
            }

            $projects = $query->get();

            $systemlog_description = '[匯出專案] 匯出筆數:' . $projects->count();
            $this->createSystemLog($member->id, '匯出', $systemlog_description, 'projects', 0, 'export');

            $fileName = '專案_' . date('YmdHis') . '.xlsx';
            return Excel::download(new ProjectsExport($projects), $fileName);

        } catch (\Exception $e) {
            \Log::error('Export projects error: ' . $e->getMessage());
            return $this->errorResponse('匯出失敗：' . $e->getMessage());
        }
    }

    /**
     * 匯入專案
     */
    public function importProjects(Request $request)
    {
        try {
            if (!$request->hasFile('file')) {
                return $this->errorResponse('請上傳檔案');
            }

            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $file = $request->file('file');
            $rawData = Excel::toArray([], $file);

            if (empty($rawData) || empty($rawData[0]) || count($rawData[0]) < 2) {
                return $this->errorResponse('檔案格式不正確或沒有數據');
            }

            $headers = $rawData[0][0];
            $dataRows = array_slice($rawData[0], 1);

            DB::beginTransaction();
            $successCount = 0;
            $errorRows = [];

            foreach ($dataRows as $index => $row) {
                try {
                    $projectData = [];
                    for ($j = 0; $j < count($headers); $j++) {
                        if (isset($row[$j])) {
                            $headerKey = $headers[$j];
                            $projectData[$headerKey] = $row[$j];
                        }
                    }

                    // 處理客戶
                    $customer = Customer::where('name', $projectData['客戶名稱'])
                        ->orWhere('company_name', $projectData['客戶公司名稱'])
                        ->first();
                    if (is_null($customer)) {
                        $customer = new Customer([
                            'name' => $projectData['客戶名稱'],
                            'company_name' => $projectData['客戶公司名稱'],
                            'branch_id' => $member->branch_id,
                            'branch_name' => $member->branch_name,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                        $customer->save();
                    }

                    // 處理分館
                    $branch = Branch::where('name', 'like', '%' . $projectData['所屬館別'] . '%')->first();

                    // 處理業務項目
                    $businessItem = BusinessItem::where('name', 'like', '%' . $projectData['商務項目'] . '%')
                        ->where('branch_id', $branch->id)
                        ->first();

                    $status = $projectData['狀態'] == '啟用' ? 1 : 0;

                    switch ($projectData['合約狀態']) {
                        case '未提交': $contract_status = 0; break;
                        case '審核中': $contract_status = 1; break;
                        case '已審核': $contract_status = 2; break;
                        case '未通過': $contract_status = 3; break;
                        default: $contract_status = 0;
                    }

                    switch ($projectData['付款方案']) {
                        case '月繳': $payment_period = 1; break;
                        case '季繳': $payment_period = 2; break;
                        case '半年繳': $payment_period = 3; break;
                        case '年繳': $payment_period = 4; break;
                    }

                    $contract_type = preg_replace('/[^0-9]/', '', $projectData['合約類型']);

                    $project = new Project([
                        'projectName' => $projectData['專案名稱'] ?? null,
                        'business_item_id' => $businessItem->id,
                        'customer_id' => $customer->id,
                        'member_id' => $member->id,
                        'branch_id' => $branch->id,
                        'start_day' => $this->formatDate($projectData['起租時間']),
                        'end_day' => $this->formatDate($projectData['結束時間']),
                        'signing_day' => $this->formatDate($projectData['簽約日期']),
                        'pay_day' => $projectData['約定付款日期'],
                        'payment_period' => $payment_period,
                        'contractType' => $contract_type,
                        'original_price' => $projectData['原價'] ?? null,
                        'sale_price' => $projectData['售價'] ?? null,
                        'current_payment' => $projectData['單期費用'] ?? null,
                        'total_payment' => $projectData['合約總金額'] ?? null,
                        'penalty_fee' => $projectData['違約金'] ?? null,
                        'late_fee' => $projectData['滯納金比例'] ?? null,
                        'deposit' => $projectData['押金'] ?? null,
                        'next_pay_day' => array_key_exists('下次付款日期', $projectData) ? $this->formatDate($projectData['下次付款日期']) : null,
                        'last_pay_day' => array_key_exists('最後付款日期', $projectData) ? $this->formatDate($projectData['最後付款日期'], 'Y-m-d H:i:s') : null,
                        'status' => $status,
                        'contract_status' => $contract_status,
                        'broker' => $projectData['介紹人'] ?? null,
                        'broker_remark' => $projectData['介紹人備註'] ?? null,
                        'remark' => $projectData['合約備註'] ?? null,
                        'created_at' => $this->formatDate($projectData['建立時間'], 'Y-m-d H:i:s') ?? now(),
                        'updated_at' => now()
                    ]);

                    $project->save();
                    $successCount++;
                } catch (\Exception $e) {
                    $errorRows[] = [
                        'row_index' => $index + 2,
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            $response = [
                'status' => true,
                'message' => "成功導入 {$successCount} 筆專案"
            ];

            if (!empty($errorRows)) {
                $response['warnings'] = "有 " . count($errorRows) . " 筆數據導入失敗";
                $response['error_rows'] = $errorRows;
            }

            $systemlog_description = '[匯入專案] 匯入筆數:' . $successCount;
            $this->createSystemLog($member->id, '匯入', $systemlog_description, 'projects', 0, 'import');

            return response()->json($response);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Import projects error: ' . $e->getMessage());
            return $this->errorResponse('匯入失敗：' . $e->getMessage());
        }
    }
}
