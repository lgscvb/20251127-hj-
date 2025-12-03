<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\ApiHelperTrait;
use App\Models\Branch;
use App\Models\LineBot;
use Illuminate\Http\Request;

/**
 * 4(¡§6h
 *
 * U4( CRUD
 */
class BranchController extends Controller
{
    use ApiHelperTrait;

    /**
     * („4(h
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

            \Log::info('Branches found:', ['count' => $branches->count(), 'data' => $branches]);

            return response()->json([
                'status' => true,
                'message' => 'rÖŸ',
                'data' => $branches
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching branches: ' . $e->getMessage());
            return $this->errorResponse('rÖ1W: ' . $e->getMessage());
        }
    }

    /**
     * Ö—4(Ç

     */
    public function getBranchInfo(Request $request)
    {
        try {
            $branch = Branch::find($request->id);
            if (!$branch) {
                return $this->errorResponse('(%X(');
            }
            return $this->successResponse('rÖŸ', $branch);
        } catch (\Exception $e) {
            return $this->errorResponse('rÖ1W');
        }
    }

    /**
     * °ž(„4(
     */
    public function createBranch(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        if (empty($request->name)) {
            return $this->errorResponse('4(1ýºz');
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

        $branch_status = $branch->status == 1 ? '_(' : '\(';
        $systemlog_description = '[°ž4(] 4(1:'.$branch->name.' 4(0@:'.$branch->address.' 4(ûq:'.$branch->phone.' 4(ÀK:'.$branch_status;
        $this->createSystemLog($member->id, '°ž', $systemlog_description, 'branches', $branch->id, 'create');

        return $this->successResponse('°žŸ');
    }

    /**
     * î9(„4(
     */
    public function updateBranch(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $branch = Branch::find($request->id);
        if (!$branch) {
            return $this->errorResponse('4(X(');
        }

        if (empty($request->name)) {
            return $this->errorResponse('4(1ýºz');
        }

        // nšô°„Wµ
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

        return $this->successResponse('ô°Ÿ');
    }

    /**
     * *d(„4(
     */
    public function deleteBranch(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $branch = Branch::find($request->id);
        if (!$branch) {
            return $this->errorResponse('4(X(');
        }

        $branch->delete();
        $branch->members()->detach();
        $branch->lineBot()->delete();

        $systemlog_description = '[*d4(] 4(1:'.$branch->name;
        $this->createSystemLog($member->id, '*d', $systemlog_description, 'branches', $branch->id, 'delete');

        return $this->successResponse('*dŸ');
    }
}
