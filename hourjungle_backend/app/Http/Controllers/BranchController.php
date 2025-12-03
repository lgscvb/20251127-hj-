<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\ApiHelperTrait;
use App\Models\Branch;
use App\Models\LineBot;
use Illuminate\Http\Request;

/**
 * 分館管理控制器
 *
 * 處理分館 CRUD
 */
class BranchController extends Controller
{
    use ApiHelperTrait;

    /**
     * 取得分館列表
     */
    public function getBranchList(Request $request)
    {
        try {
            \Log::info('Fetching branches from database');

            $branches = Branch::select(
                'id',
                'name',
                'address',
                'phone',
                'email',
                'website',
                'logo',
                'manager',
                'manager_phone',
                'manager_email',
                'description',
                'remarks',
                'status',
                'created_at',
                'updated_at'
            )->get();

            \Log::info('Branches found:', ['count' => $branches->count()]);

            return response()->json([
                'status' => true,
                'message' => 'success',
                'data' => $branches
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching branches: ' . $e->getMessage());
            return $this->errorResponse('Failed to fetch branches: ' . $e->getMessage());
        }
    }

    /**
     * 取得單一分館資訊
     */
    public function getBranchInfo(Request $request)
    {
        try {
            $branch = Branch::find($request->id);
            if (!$branch) {
                return $this->errorResponse('Branch not found');
            }
            return $this->successResponse('success', $branch);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get branch info');
        }
    }

    /**
     * 新增分館
     */
    public function createBranch(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        if (empty($request->name)) {
            return $this->errorResponse('Branch name is required');
        }

        if (empty($request->status)) {
            $request->merge(['status' => 1]);
        }

        $branch = Branch::create($request->all());
        LineBot::create([
            'branch_id' => $branch->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $branch_status = $branch->status == 1 ? 'Enabled' : 'Disabled';
        $systemlog_description = '[Create Branch] Name:'.$branch->name.' Address:'.$branch->address.' Phone:'.$branch->phone.' Status:'.$branch_status;
        $this->createSystemLog($member->id, 'Create', $systemlog_description, 'branches', $branch->id, 'create');

        return $this->successResponse('Branch created successfully');
    }

    /**
     * 更新分館
     */
    public function updateBranch(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $branch = Branch::find($request->id);
        if (!$branch) {
            return $this->errorResponse('Branch not found');
        }

        if (empty($request->name)) {
            return $this->errorResponse('Branch name is required');
        }

        // 只更新提交的欄位
        $branch->update([
            'name' => $request->name,
            'status' => (int)$request->status,
            'address' => $request->address,
            'phone' => $request->phone,
            'email' => $request->email,
            'website' => $request->website,
            'manager' => $request->manager,
            'manager_phone' => $request->manager_phone,
            'manager_email' => $request->manager_email,
            'description' => $request->description,
            'remarks' => $request->remarks
        ]);

        return $this->successResponse('Branch updated successfully');
    }

    /**
     * 刪除分館
     */
    public function deleteBranch(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $branch = Branch::find($request->id);
        if (!$branch) {
            return $this->errorResponse('Branch not found');
        }

        $branch->delete();
        $branch->members()->detach();
        $branch->lineBot()->delete();

        $systemlog_description = '[Delete Branch] Name:'.$branch->name;
        $this->createSystemLog($member->id, 'Delete', $systemlog_description, 'branches', $branch->id, 'delete');

        return $this->successResponse('Branch deleted successfully');
    }
}
