<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Customer;
use App\Models\BusinessItem;
use App\Models\Branch;
use App\Models\LineBot;
use App\Models\Config;
use App\Models\Project;
use App\Models\PaymentHistory;
use App\Models\LineMessage;
use App\Models\LineUser;
use App\Models\SystemLog;
use App\Http\Controllers\LineBotController;

use Illuminate\Support\Facades\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;

//匯出 Excel
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\CustomersExport;
use App\Exports\BusinessItemsExport;
use App\Exports\ProjectsExport;


class ApiController extends Controller
{
    //取得所有的權限項目
    public function getPermissions()
    {
        $permissions = Permission::all();

        // 按照category分組
        $groupedPermissions = $permissions->groupBy('category');
        $permissions = $groupedPermissions->map(function($group) {
            return [
                'category' => $group[0]->category ?? '未分類',
                'permissions' => $group->map(function($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name
                    ];
                })
            ];
        })->values();
        return response()->json([
            'status' => true,
            'message' => 'success',
            'data' => $permissions
        ]);
    }

    //取得所有的群組名稱
    public function getRoles()
    {
        $roles = Role::with('permissions')->get();
        $data = [];
        foreach ($roles as $role) {
            $data[] = [
                'id' => $role->id,
                'name' => $role->name,
                'status' => $role->status,
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
                'permissions' => $role->permissions->pluck('id')->toArray()
            ];
        }
        return response()->json([
            'status' => true,
            'message' => 'success',
            'data' => $data
        ]);
    }

    //新增權限項目
    public function createPermission(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        // 驗證請求參數
        if (empty($request->category) || empty($request->name)) {
            return response()->json([
                'status' => false,
                'message' => '分類和名稱不能為空'
            ]);
        }

        // 檢查該分類下是否已存在相同名稱的權限
        $existingPermission = Permission::where('category', $request->category)
            ->where('name', $request->name)->first();

        if ($existingPermission) {
            return response()->json([
                'status' => false,
                'message' => '該分類下已存在相同名稱的權限'
            ]);
        }
        $permission = Permission::create($request->all());

        //20250307
        $systemlog_description = '[新增權限] 權限名稱:'.$permission->name.' 權限分類:'.$permission->category;
        $this->createSystemLog($member->id, '新增', $systemlog_description, 'permissions', $permission->id, 'create');

        return response()->json([
            'status' => true,
            'message' => '新增成功'
        ]);
    }

    //新增群組名稱
    public function createRole(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        // 驗證請求參數
        if (empty($request->name)) {
            return response()->json([
                'status' => false,
                'message' => '群組名稱不能為空'
            ]);
        }
        // 檢查該群組名稱是否已存在
        $existingRole = Role::where('name', $request->name)->first();
        if ($existingRole) {
            return response()->json([
                'status' => false,
                'message' => '該群組名稱已存在'
            ]);
        }
        $role = Role::create($request->all());

        //20250307
        $systemlog_description = '[新增群組] 群組名稱:'.$role->name;
        $this->createSystemLog($member->id, '新增', $systemlog_description, 'roles', $role->id, 'create');

        return response()->json([
            'status' => true,
            'message' => '新增成功'
        ]);
    }

    //刪除權限項目
    public function deletePermission(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $permission = Permission::find($request->id);
        if (!$permission) {
            return response()->json([
                'status' => false,
                'message' => '權限項目不存在'
            ]);
        }
        $permission->delete();

        //20250307
        $systemlog_description = '[刪除權限] 權限名稱:'.$permission->name.' 權限分類:'.$permission->category;
        $this->createSystemLog($member->id, '刪除', $systemlog_description, 'permissions', $permission->id, 'delete');

        return response()->json([
            'status' => true,
            'message' => '刪除成功'
        ]);
    }

    //刪除群組名稱
    public function deleteRole(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $role = Role::find($request->id);
        if (!$role) {
            return response()->json([
                'status' => false,
                'message' => '群組名稱不存在'
            ]);
        }
        $role->delete();

        //20250307
        $systemlog_description = '[刪除群組] 群組名稱:'.$role->name;
        $this->createSystemLog($member->id, '刪除', $systemlog_description, 'roles', $role->id, 'delete');

        return response()->json([
            'status' => true,
            'message' => '刪除成功'
        ]);
    }

    //修改群組名稱
    public function modifyRole(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $role = Role::find($request->id);
        if (!$role) {
            return response()->json([
                'status' => false,
                'message' => '群組不存在'
            ]);
        }

        // 確保狀態值被正確更新
        $role->update([
            'name' => $request->name,
            'status' => (int)$request->status, // 確保轉換為整數
            'updated_at' => now()
        ]);

        //20250307
        $role_status = $role->status == 1 ? '啟用' : '停用';
        $systemlog_description = '[修改群組] 群組名稱:'.$role->name.' 群組狀態:'.$role_status;
        $this->createSystemLog($member->id, '修改', $systemlog_description, 'roles', $role->id, 'update');

        return response()->json([
            'status' => true,
            'message' => '修改成功'
        ]);
    }

    //建立或修改群組與權限的關聯
    public function createOrUpdateRolePermission(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $role = Role::find($request->role_id);
        $permission_ids = explode(',', $request->permission_ids);
        $permissions = Permission::whereIn('id', $permission_ids)->get();
        if (!$role || !$permissions) {
            return response()->json([
                'status' => false,
                'message' => '群組或權限不存在'
            ]);
        }

        $role->permissions()->sync($permissions);

        //20250307
        $systemlog_description = '[建立或修改群組權限] 群組名稱:'.$role->name.' 權限:'.$permissions->pluck('name')->implode(',');
        $this->createSystemLog($member->id, '建立或修改', $systemlog_description, 'roles', $role->id, 'update');

        return response()->json([
            'status' => true,
            'message' => '建立成功'
        ]);
    }

    //建立使用者會用到的資訊
    public function createMemberInfo(Request $request)
    {
        //取得場館資訊
        $branch = Branch::select('id', 'name')->where('status', 1)->get();
        //取得群組資訊
        $role = Role::select('id', 'name')->where('status', 1)->get();
        return response()->json([
            'status' => true,
            'message' => '獲取成功',
            'data' => [
                'branch' => $branch,
                'role' => $role
            ]
        ]);
    }
    //建立使用者
    public function createMember(Request $request)
    {
        $login_member = $this->isLogin();
        if(is_null($login_member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        try {
            // 驗證必填欄位
            if (empty($request->account)) {
                return response()->json([
                    'status' => false,
                    'message' => '帳號不能為空'
                ]);
            }

            if (empty($request->password)) {
                return response()->json([
                    'status' => false,
                    'message' => '密碼不能為空'
                ]);
            }

            // 檢查帳號是否已存在
            if (Member::where('account', $request->account)->exists()) {
                return response()->json([
                    'status' => false,
                    'message' => '帳號已存在'
                ]);
            }

            // 創建新會員
            $member = Member::create([
                'account' => $request->account,
                'password' => Hash::make($request->password),
                'nickname' => $request->nickname,
                'email' => $request->email,
                'phone' => $request->phone,
                'status' => $request->status ?? 1,
                'role_id' => $request->role_id,
                'branch_id' => $request->branch_id, // 直接設置 branch_id
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 設置角色關聯（這是多對多關係，所以使用 sync）
            if ($request->role_id) {
                $member->roles()->sync([$request->role_id]);
            }

            //20250307
            $member_status = $member->status == 1 ? '啟用' : '停用';
            $systemlog_description = '[新增使用者] 帳號:'.$member->account.' 暱稱:'.$member->nickname.' 電子郵件:'.$member->email.' 手機號碼:'.$member->phone.' 狀態:'.$member_status.' 群組:'.$member->role->name.' 場館:'.$member->branch->name;
            $this->createSystemLog($login_member->id, '新增', $systemlog_description, 'members', $member->id, 'create');

            return response()->json([
                'status' => true,
                'message' => '新增成功'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '新增失敗：' . $e->getMessage()
            ]);
        }
    }

    //修改使用者
    public function updateMember(Request $request)
    {
        $login_member = $this->isLogin();
        if(is_null($login_member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $member = Member::find($request->id);
        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '使用者不存在'
            ]);
        }

        if (empty($request->password)) {
            return response()->json([
                'status' => false,
                'message' => '密碼不能為空'
            ]);
        }

        if (empty($request->nickname)) {
            return response()->json([
                'status' => false,
                'message' => '暱稱不能為空'
            ]);
        }

        if (empty($request->role_id)) {
            return response()->json([
                'status' => false,
                'message' => '群組不能為空'
            ]);
        }

        $role = Role::find($request->role_id);
        if (!$role) {
            return response()->json([
                'status' => false,
                'message' => '群組不存在'
            ]);
        }

        if (empty($request->branch_id)) {
            return response()->json([
                'status' => false,
                'message' => '場館不能為空'
            ]);
        }

        // 檢查場館是否存在
        $branch = Branch::find($request->branch_id);
        if (!$branch) {
            return response()->json([
                'status' => false,
                'message' => '場館不存在'
            ]);
        }
        // 如果mail有值的話就驗證是否符合email格式
        if(!empty($request->email)) {
            if (!filter_var($request->email, FILTER_VALIDATE_EMAIL)) {
                return response()->json([
                    'status' => false,
                    'message' => '電子郵件格式不正確'
                ]);
            }
        }

        // 如果phone有值的話 就驗證格式是否符合phone格式
        if(!empty($request->phone)) {
            if (!preg_match('/^09\d{8}$/', $request->phone)) {
                return response()->json([
                    'status' => false,
                    'message' => '手機號碼格式不正確'
                ]);
            }
        }

        // 如果branch_id有值的話 就驗證是否符合branch_id格式
        if(!empty($request->branch_id)) {
            if(!is_numeric($request->branch_id)) {
                return response()->json([
                    'status' => false,
                    'message' => 'branch_id格式不正確'
                ]);
            }
        }

        // 更新會員資料
        $member->update([
            'nickname' => $request->nickname,
            'password' => Hash::make($request->password),
            'status' => $request->status,
            'email' => $request->email,
            'phone' => $request->phone,
            'role_id' => $request->role_id,
            'branch_id' => $request->branch_id,
            'updated_at' => now()
        ]);

        // 更新會員群組
        // $member->roles()->sync([$request->role_id]);

        // 更新會員場館
        // $member->branch()->sync([$request->branch_id]);

        //20250307
        $member_status = $member->status == 1 ? '啟用' : '停用';
        $systemlog_description = '[修改使用者] 帳號:'.$member->account.' 暱稱:'.$member->nickname.' 電子郵件:'.$member->email.' 手機號碼:'.$member->phone.' 狀態:'.$member_status.' 群組:'.$member->role->name.' 場館:'.$member->branch->name;
        $this->createSystemLog($login_member->id, '修改', $systemlog_description, 'members', $member->id, 'update');

        return response()->json([
            'status' => true,
            'message' => '修改成功'
        ]);
    }

    //刪除使用者
    public function deleteMember(Request $request)
    {
        $login_member = $this->isLogin();
        if(is_null($login_member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $member = Member::find($request->id);
        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '使用者不存在'
            ]);
        }
        $member->delete();
        // $member->roles()->detach();
        // $member->branch()->detach();

        //20250307
        $systemlog_description = '[刪除使用者] 帳號:'.$member->account.' 暱稱:'.$member->nickname.' 電子郵件:'.$member->email.' 手機號碼:'.$member->phone.' 狀態:'.$member->status.' 群組:'.$member->role->name.' 場館:'.$member->branch->name;
        $this->createSystemLog($login_member->id, '刪除', $systemlog_description, 'members', $member->id, 'delete');

        return response()->json([
            'status' => true,
            'message' => '刪除成功'
        ]);
    }

    //取得使用者資訊
    public function getMemberInfo(Request $request)
    {
        $member = Member::with('roles', 'branch')->find($request->id);
        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '使用者不存在'
            ]);
        }

        // 獲取第一個角色的名稱（假設每個用戶只有一個角色）
        $roleName = $member->roles->first() ? $member->roles->first()->name : '';

        // 獲取第一個場館的名稱（假設每個用戶只有一個場館）
        $branchName = $member->branch->first() ? $member->branch->first()->name : '';

        $data = [
            'id' => $member->id,
            'account' => $member->account,
            'nickname' => $member->nickname,
            'status' => $member->status,
            'role_id' => $member->role_id,
            'role_name' => $member->role ? $member->role->name : '',
            'branch_id' => $member->branch_id,
            'branch' => $member->branch ? $member->branch->name : '',
            'last_login' => $member->last_login,
            'created_at' => $member->created_at,
            'updated_at' => $member->updated_at,
        ];

        return response()->json([
            'status' => true,
            'message' => '取得成功',
            'data' => $data
        ]);
    }

    //修改使用者密碼
    public function updateMemberPassword(Request $request)
    {
        $member = Member::find($request->id);
        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '使用者不存在'
            ]);
        }
        if (empty($request->password)) {
            return response()->json([
                'status' => false,
                'message' => '密碼不能為空'
            ]);
        }
        $member->password = Hash::make($request->password);
        $member->updated_at = now();
        $member->save();

        //20250307
        $systemlog_description = '[修改使用者密碼] 帳號:'.$member->account.' 密碼:'.$request->password;
        $this->createSystemLog($member->id, '修改', $systemlog_description, 'members', $member->id, 'update');

        return response()->json([
            'status' => true,
            'message' => '修改成功'
        ]);
    }

    //重置使用者密碼
    public function resetMemberPassword(Request $request)
    {
        $login_member = $this->isLogin();
        if(is_null($login_member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $member = Member::find($request->id);
        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '使用者不存在'
            ]);
        }
        $member->password = Hash::make('123456');
        $member->updated_at = now();
        $member->save();

        //20250307
        $systemlog_description = '[重置使用者密碼] 帳號:'.$member->account.' 密碼:123456';
        $this->createSystemLog($login_member->id, '修改', $systemlog_description, 'members', $member->id, 'update');

        return response()->json([
            'status' => true,
            'message' => '重置成功，密碼為123456'
        ]);
    }

    //使用者的場館 列表
    public function getBranchList(Request $request)
    {
        try {
            // 添加 debug 信息
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
                'message' => '獲取成功',
                'data' => $branches
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching branches: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '獲取失敗: ' . $e->getMessage()
            ]);
        }
    }

    //取得場館資訊
    public function getBranchInfo(Request $request)
    {
        try {
            $branch = Branch::find($request->id);
            if (!$branch) {
                return response()->json([
                    'status' => false,
                    'message' => '館別不存在'
                ]);
            }
            return response()->json([
                'status' => true,
                'message' => '獲取成功',
                'data' => $branch
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '獲取失敗'
            ]);
        }
    }

    //新增使用者的場館
    public function createBranch(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        if (empty($request->name)) {
            return response()->json([
                'status' => false,
                'message' => '場館名稱不能為空'
            ]);
        }

        // if (empty($request->address)) {
        //     return response()->json([
        //         'status' => false,
        //         'message' => '場館地址不能為空'
        //     ]);
        // }

        // if (empty($request->phone)) {
        //     return response()->json([
        //         'status' => false,
        //         'message' => '場館電話不能為空'
        //     ]);
        // }

        if (empty($request->status )) {
            $request->merge(['status' => 1]);
        }
        
        $branch = Branch::create($request->all());
        LineBot::create([
            'branch_id' => $branch->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        //20250307
        $branch_status = $branch->status == 1 ? '啟用' : '停用';
        $systemlog_description = '[新增場館] 場館名稱:'.$branch->name.' 場館地址:'.$branch->address.' 場館電話:'.$branch->phone.' 場館狀態:'.$branch_status;
        $this->createSystemLog($member->id, '新增', $systemlog_description, 'branches', $branch->id, 'create');

        return response()->json([
            'status' => true,
            'message' => '新增成功'
        ]);
    }


        //修改使用者的場館
        public function updateBranch(Request $request)
        {
            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }
            $branch = Branch::find($request->id);
            if (!$branch) {
                return response()->json([
                    'status' => false,
                    'message' => '場館不存在'
                ]);
            }
    
            if (empty($request->name)) {
                return response()->json([
                    'status' => false,
                    'message' => '場館名稱不能為空'
                ]);
            }
    
            // 明确指定要更新的字段
            $branch->update([
                'name' => $request->name,
                'status' => (int)$request->status,  // 确保转换为整数
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
    
            return response()->json([
                'status' => true,
                'message' => '更新成功'
            ]);
        }

    //刪除使用者的場館
    public function deleteBranch(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $branch = Branch::find($request->id);
        if (!$branch) {
            return response()->json([
                'status' => false,
                'message' => '場館不存在'
            ]);
        }
        $branch->delete();
        $branch->members()->detach();
        $branch->lineBot()->delete();

        //20250307
        $systemlog_description = '[刪除場館] 場館名稱:'.$branch->name;
        $this->createSystemLog($member->id, '刪除', $systemlog_description, 'branches', $branch->id, 'delete');

        return response()->json([
            'status' => true,
            'message' => '刪除成功'
        ]);
    }

    //登入
    public function login(Request $request)
    {
        $member = Member::where('account', $request->account)->first();
        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '使用者不存在'
            ]);
        }
        if (Hash::check($request->password, $member->password)) {
            if($member->status == 0) {
                return response()->json([
                    'status' => false,
                    'message' => '使用者已停用'
                ]);
            }
            $member->token = Str::random(60);
            $member->last_login = now();
            $member->save();

            // 獲取該用戶角色的所有權限
            $permissions = [];
            if ($member->role) {
                $permissions = $member->role->permissions->map(function($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'category' => $permission->category
                    ];
                });
            }
            
            $data = [
                'id' => $member->id,
                'account' => $member->account,
                'nickname' => $member->nickname,
                'token' => $member->token,
                'email' => $member->email,
                'phone' => $member->phone,
                'is_top_account' => $member->is_top_account,
                'role_id' => $member->role_id,
                'last_login' => $member->last_login,
                'branch_id' => $member->branch_id,
                'status' => $member->status,
                'role_name' => $member->role ? $member->role->name : '',
                'permissions' => $permissions, // 修改這裡，返回權限數組
                'branch' => $member->branch ? $member->branch->name : '',
            ];
            
            return response()->json([
                'status' => true,
                'message' => '登入成功',
                'data' => $data
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => '密碼錯誤'
            ]);
        }
    }

    //登出
    public function logout(Request $request)
    {
        $member = Member::find($request->id);
        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '使用者不存在'
            ]);
        }
        $member->token = null;
        $member->save();
        return response()->json([
            'status' => true,
            'message' => '登出成功'
        ]);
    }

    //取得所有使用者
    public function getAllMembers(Request $request)
    {
        try {
            $query = Member::with(['role', 'branch'])
                ->select('id', 'account', 'nickname', 'email', 'phone', 'role_id', 'branch_id', 'status', 'last_login');
            // 處理搜索
            if ($request->has('keyword')) {
                $keyword = $request->keyword;
                $query->where(function($q) use ($keyword) {
                    $q->where('account', 'like', "%{$keyword}%")
                        ->orWhere('nickname', 'like', "%{$keyword}%")
                        ->orWhere('email', 'like', "%{$keyword}%");
                });
            }

            // 分頁
            $perPage = $request->input('per_page', 10);
            $members = $query->paginate($perPage);

            // 格式化數據
            $formattedMembers = $members->map(function($member) {
                return [
                    'id' => $member->id,
                    'account' => $member->account,
                    'nickname' => $member->nickname,
                    'email' => $member->email,
                    'phone' => $member->phone,
                    'role_id' => $member->role_id,
                    'roles' => $member->role ? $member->role->name : null,
                    'branch_id' => $member->branch_id,
                    'branch' => $member->branch ? $member->branch->name : null,
                    'status' => $member->status,
                    'last_login' => $member->last_login
                ];
            });

            return response()->json([
                'status' => true,
                'message' => 'success',
                'data' => $formattedMembers,
                'current_page' => $members->currentPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
    
    //取得所有客戶資料
    public function getCustomersList(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $keyword = $request->get('keyword');
            $branchId = $request->get('branch_id');

            // 獲取查詢構建器
            $query = Customer::query()
                ->leftJoin('branches', 'customers.branch_id', '=', 'branches.id')
                ->select(
                    'customers.*',
                    'branches.name as branch_name'
                );

            // 如果指定了分館ID，則只顯示該分館的數據
            if ($branchId) {
                $query->where('customers.branch_id', $branchId);
            }

            // 如果有關鍵字，添加搜尋條件
            if ($keyword) {
                $query->where(function ($q) use ($keyword) {
                    $q->where('customers.name', 'like', "%{$keyword}%")
                        ->orWhere('customers.phone', 'like', "%{$keyword}%")
                        ->orWhere('customers.email', 'like', "%{$keyword}%")
                        ->orWhere('customers.company_name', 'like', "%{$keyword}%");
                });
            }

            // 添加日誌
            \Log::info('Customer query:', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'branch_id' => $branchId,
                'keyword' => $keyword
            ]);

            // 獲取分頁數據
            $customers = $query->paginate($perPage);

            // 記錄返回的數據
            \Log::info('Customers data:', [
                'count' => $customers->count(),
                'total' => $customers->total(),
                'data' => $customers->items()
            ]);

            // 重新格式化數據
            $customers->getCollection()->transform(function ($customer) {
                return [
                    'id' => $customer->id,
                    'number' => $customer->number,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'birthday' => $customer->birthday,
                    'address' => $customer->address,
                    'company_name' => $customer->company_name,
                    'company_number' => $customer->company_number,
                    'company_website' => $customer->company_website,
                    'company_email' => $customer->company_email,
                    'company_address' => $customer->company_address,
                    'company_phone' => $customer->company_phone,
                    'company_fax' => $customer->company_fax,
                    'company_contact_person' => $customer->company_contact_person,
                    'company_contact_person_phone' => $customer->company_contact_person_phone,
                    'company_contact_person_email' => $customer->company_contact_person_email,
                    'line_id' => $customer->line_id,
                    'line_nickname' => $customer->line_nickname,
                    'branch_id' => $customer->branch_id,
                    'branch_name' => $customer->branch_name,
                    'status' => $customer->status,
                    'created_at' => $customer->created_at->format('Y-m-d H:i:s')
                ];
            });

            return response()->json([
                'status' => true,
                'message' => '獲取成功',
                'data' => $customers->items(),
                'current_page' => $customers->currentPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '獲取失敗：' . $e->getMessage()
            ], 500);
        }
    }

    //新增客戶
    public function createCustomer(Request $request)
    {
        try {
            $member = $this->isLogin();
            // 检查登录状态
            if(is_null($member) || !($member instanceof Member)) {
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            // 验证必填栏位
            if (empty($request->get('name'))) {
                return response()->json([
                    'status' => false,
                    'message' => '客戶姓名不能為空'
                ]);
            }

            // 创建客户资料
            $customerData = $request->all();

            // 确保 branch_id 被设置
            if (!isset($customerData['branch_id']) || empty($customerData['branch_id'])) {
                $customerData['branch_id'] = $member->branch_id;
            }

            // 确保 Customer 模型允许 branch_id 被批量赋值
            $customer = new Customer();
            $customer->fill($customerData);
            $customer->branch_id = $customerData['branch_id']; // 明确设置 branch_id
            $customer->save();

            // 处理照片上传
            if ($request->hasFile('id_card_front')) {
                $customer->id_card_front = $this->handleImageUpload($request->file('id_card_front'), 'customer_id_card_front', $customer->id);
            }
            
            if ($request->hasFile('id_card_back')) {
                $customer->id_card_back = $this->handleImageUpload($request->file('id_card_back'), 'customer_id_card_back', $customer->id);
            }

            $customer->save();

            // 获取分馆名称
            $branch = Branch::find($customer->branch_id);
            $customer->branch_name = $branch ? $branch->name : null;

            //20250307
            $customer_status = $customer->status == 1 ? '啟用' : '停用';
            $systemlog_description = '[新增客戶] 客戶姓名:'.$customer->name.' 客戶電話:'.$customer->phone.' 客戶電子郵件:'.$customer->email.' 客戶地址:'.$customer->address.' 客戶公司名稱:'.$customer->company_name.' 客戶公司統一編號:'.$customer->company_number.' 客戶公司網址:'.$customer->company_website.' 客戶公司電話:'.$customer->company_phone.' 客戶公司傳真:'.$customer->company_fax.' 客戶公司聯絡人:'.$customer->company_contact_person.' 客戶公司聯絡人電話:'.$customer->company_contact_person_phone.' 客戶公司聯絡人電子郵件:'.$customer->company_contact_person_email.' 客戶Line ID:'.$customer->line_id.' 客戶Line 暱稱:'.$customer->line_nickname.' 客戶狀態:'.$customer_status.' 客戶備註:'.$customer->remark;
            $this->createSystemLog($member->id, '新增', $systemlog_description, 'customers', $customer->id, 'create');

            return response()->json([
                'status' => true,
                'message' => '新增成功',
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            \Log::error('Create customer error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '新增失敗：' . $e->getMessage()
            ]);
        }
    }

    //修改客戶
    public function updateCustomer(Request $request)
    {
        try {
            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }
            \Log::info('Update customer request data:', $request->all());
            
            $customer = Customer::find($request->id);
            if (!$customer) {
                return response()->json([
                    'status' => false,
                    'message' => '客戶不存在'
                ]);
            }

            // 驗證請求參數
            // 如果number有更改，才需要檢查是否重複
            if ($request->get('number') !== $customer->number) {
                $existingCustomer = Customer::where('number', $request->get('number'))
                    ->where('id', '!=', $request->id)
                    ->first();
                if ($existingCustomer) {
                    return response()->json([
                        'status' => false,
                        'message' => '客戶編號已存在'
                    ]);
                }
            }
            
            if (empty($request->get('name'))) {
                return response()->json([
                    'status' => false,
                    'message' => '客戶姓名不能為空'
                ]);
            }

            // 更新客戶資料
            $updateData = [
                'number' => $request->get('number'),
                'name' => $request->get('name'),
                'email' => $request->get('email'),
                'id_number' => $request->get('id_number'),
                'birthday' => $request->get('birthday'),
                'address' => $request->get('address'),
                'phone' => $request->get('phone'),
                'company_name' => $request->get('company_name'),
                'company_number' => $request->get('company_number'),
                'company_website' => $request->get('company_website'),
                'company_email' => $request->get('company_email'),
                'company_address' => $request->get('company_address'),
                'company_phone' => $request->get('company_phone'),
                'company_fax' => $request->get('company_fax'),
                'company_contact_person' => $request->get('company_contact_person'),
                'company_contact_person_phone' => $request->get('company_contact_person_phone'),
                'company_contact_person_email' => $request->get('company_contact_person_email'),
                'line_id' => $request->get('line_id'),
                'line_nickname' => $request->get('line_nickname'),
                'status' => $request->get('status') ? 1 : 0,
                'modify' => $request->get('modify') ? 1 : 0,
                'remark' => $request->get('remark'),
                'updated_at' => now()
            ];

            // 處理照片更新
            if ($request->hasFile('id_card_front')) {
                // 刪除舊照片
                if ($customer->id_card_front) {
                    Storage::disk('public')->delete($customer->id_card_front);
                }
                $updateData['id_card_front'] = $this->handleImageUpload($request->file('id_card_front'), 'customer_id_card_front',$customer->id);
            }

            if ($request->hasFile('id_card_back')) {
                // 刪除舊照片
                if ($customer->id_card_back) {
                    Storage::disk('public')->delete($customer->id_card_back);
                }
                $updateData['id_card_back'] = $this->handleImageUpload($request->file('id_card_back'), 'customer_id_card_back',$customer->id);
            }

            \Log::info('Update data:', $updateData);

            $customer->update($updateData);

            // 處理身分證照片更新
            if ($request->hasFile('id_card_front')) {
                $path = $request->file('id_card_front')->store('id_cards', 'public');
                $customer->id_card_front = $path;
            }

            if ($request->hasFile('id_card_back')) {
                $path = $request->file('id_card_back')->store('id_cards', 'public');
                $customer->id_card_back = $path;
            }

            $customer->save();

            //20250307
            $customer_status = $customer->status == 1 ? '啟用' : '停用';
            $systemlog_description = '[修改客戶] 客戶姓名:'.$customer->name.' 客戶電話:'.$customer->phone.' 客戶電子郵件:'.$customer->email.' 客戶地址:'.$customer->address.' 客戶公司名稱:'.$customer->company_name.' 客戶公司統一編號:'.$customer->company_number.' 客戶公司網址:'.$customer->company_website.' 客戶公司電話:'.$customer->company_phone.' 客戶公司傳真:'.$customer->company_fax.' 客戶公司聯絡人:'.$customer->company_contact_person.' 客戶公司聯絡人電話:'.$customer->company_contact_person_phone.' 客戶公司聯絡人電子郵件:'.$customer->company_contact_person_email.' 客戶Line ID:'.$customer->line_id.' 客戶Line 暱稱:'.$customer->line_nickname.' 客戶狀態:'.$customer_status.' 客戶備註:'.$customer->remark;
            $this->createSystemLog($member->id, '修改', $systemlog_description, 'customers', $customer->id, 'update');

            return response()->json([
                'status' => true,
                'message' => '更新成功'
            ]);
        } catch (\Exception $e) {
            \Log::error('Update customer error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'status' => false,
                'message' => '更新失敗：' . $e->getMessage()
            ]);
        }
    }
    
    //刪除客戶
    public function deleteCustomer(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $customer = Customer::find($request->id);
        if (!$customer) {
            return response()->json([
                'status' => false,
                'message' => '客戶不存在'
            ]);
        }
        $customer->delete();

        //20250307
        $systemlog_description = '[刪除客戶] 客戶姓名:'.$customer->name;
        $this->createSystemLog($member->id, '刪除', $systemlog_description, 'customers', $customer->id, 'delete');

        return response()->json([
            'status' => true,
            'message' => '刪除成功'
        ]);
    }

    //取得客戶資訊
    public function getCustomerInfo(Request $request)
    {
        $customer = Customer::find($request->id);
        if (!$customer) {
            return response()->json([
                'status' => false,
                'message' => '客戶不存在'
            ]);
        }
        return response()->json([
            'status' => true,
            'message' => '獲取成功',
            'data' => $customer
        ]);
    }

    //新增業務項目
    public function createBusinessItem(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        //number,name,status,remarks
        //驗證請求參數
        if (!empty($request->number)) {
            $businessItem = BusinessItem::where('number', $request->number)->first();
            if($businessItem) {
                return response()->json([
                    'status' => false,
                    'message' => '業務項目編號已存在'
                ]);
            }
        }else{
            //依照最後一個業務項目編號+1
            $lastBusinessItem = BusinessItem::orderBy('number', 'desc')->first();
            $nextNumber = $lastBusinessItem ? $lastBusinessItem->number + 1 : 1;
            $request->merge(['number' => $nextNumber]);
        }

        if (empty($request->name)) {
            return response()->json([
                'status' => false,
                'message' => '業務項目名稱不能為空'
            ]);
        }
        if (empty($request->price)) {
            $request->merge(['price' => 0]);
        }
        if (empty($request->deposit)) {
            $request->merge(['deposit' => 0]);
        }
        // 驗證 price 和 deposit 是否為有效數字
        if (!empty($request->price) && !is_numeric($request->price)) {
            return response()->json([
                'status' => false,
                'message' => '金額必須為數字'
            ]);
        }

        if (!empty($request->deposit) && !is_numeric($request->deposit)) {
            return response()->json([
                'status' => false,
                'message' => '押金必須為數字'
            ]);
        }
        if (empty($request->branch_id)) {
            return response()->json([
                'status' => false,
                'message' => '請選擇所屬場館'
            ]);
        }
        // 验证场馆是否存在
        $branch = Branch::find($request->branch_id);
        if (!$branch) {
            return response()->json([
                'status' => false,
                'message' => '所選場館不存在'
            ]);
        }

        if (empty($request->status)) {
            $request->merge(['status' => 1]);
        }

        $businessItem = BusinessItem::create($request->all()); 
        
        //20250307
        $businessItem_status = $businessItem->status == 1 ? '啟用' : '停用';
        $systemlog_description = '[新增業務項目] 業務項目編號:'.$businessItem->number.' 業務項目名稱:'.$businessItem->name.' 業務項目金額:'.$businessItem->price.' 業務項目押金:'.$businessItem->deposit.' 業務項目狀態:'.$businessItem_status;
        $this->createSystemLog($member->id, '新增', $systemlog_description, 'business_items', $businessItem->id, 'create');

        return response()->json([
            'status' => true,
            'message' => '新增成功'
        ]);
    }

    //修改業務項目
    public function updateBusinessItem(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $businessItem = BusinessItem::find($request->id);
        if (!$businessItem) {
            return response()->json([
                'status' => false,
                'message' => '業務項目不存在'
            ]);
        }
        
        if (empty($request->name)) {
            return response()->json([
                'status' => false,
                'message' => '業務項目名稱不能為空'
            ]);
        }

        if (empty($request->status)) {
            $request->merge(['status' => 1]);
        }

        $businessItem->update($request->all());

        //20250307
        $businessItem_status = $businessItem->status == 1 ? '啟用' : '停用';
        $systemlog_description = '[修改業務項目] 業務項目編號:'.$businessItem->number.' 業務項目名稱:'.$businessItem->name.' 業務項目金額:'.$businessItem->price.' 業務項目押金:'.$businessItem->deposit.' 業務項目狀態:'.$businessItem_status;
        $this->createSystemLog($member->id, '修改', $systemlog_description, 'business_items', $businessItem->id, 'update');

        return response()->json([
            'status' => true,
            'message' => '修改成功'
        ]); 
    }

    //刪除業務項目
    public function deleteBusinessItem(Request $request)
    {
        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }
        $businessItem = BusinessItem::find($request->id);
        if (!$businessItem) {
            return response()->json([
                'status' => false,
                'message' => '業務項目不存在'
            ]);
        }
        $businessItem->delete();

        //20250307
        $systemlog_description = '[刪除業務項目] 業務項目編號:'.$businessItem->number.' 業務項目名稱:'.$businessItem->name;
        $this->createSystemLog($member->id, '刪除', $systemlog_description, 'business_items', $businessItem->id, 'delete');

        return response()->json([
            'status' => true,
            'message' => '刪除成功'
        ]);
    }

    //取得業務項目列表
    public function getBusinessItemList(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $keyword = $request->get('keyword');
            $branchId = $request->get('branch_id');

            // 獲取查詢構建器
            $query = BusinessItem::query()
                ->leftJoin('branches', 'business_items.branch_id', '=', 'branches.id')
                ->select(
                    'business_items.*',
                    'branches.name as branch_name'
                );

            // 如果指定了分館ID，則只顯示該分館的數據
            if ($branchId) {
                $query->where('business_items.branch_id', $branchId);
            }

            // 如果有關鍵字，添加搜尋條件
            if ($keyword) {
                $query->where(function ($q) use ($keyword) {
                    $q->where('business_items.name', 'like', "%{$keyword}%")
                        ->orWhere('business_items.number', 'like', "%{$keyword}%")
                        ->orWhere('business_items.remarks', 'like', "%{$keyword}%");
                });
            }

            // 添加日誌
            \Log::info('Business items query:', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'branch_id' => $branchId,
                'keyword' => $keyword
            ]);

            // 獲取分頁數據
            $items = $query->paginate($perPage);

            // 記錄返回的數據
            \Log::info('Business items data:', [
                'count' => $items->count(),
                'total' => $items->total(),
                'data' => $items->items()
            ]);

            // 修改資料轉換部分
            $items->getCollection()->transform(function ($item) {
                return [
                    'id' => $item->id,
                    'number' => $item->number,
                    'name' => $item->name,
                    'price' => $item->price,       // 新增
                    'deposit' => $item->deposit,   // 新增
                    'branch_id' => $item->branch_id,
                    'branch_name' => $item->branch_name,
                    'remarks' => $item->remarks,
                    'status' => $item->status,
                    'created_at' => $item->created_at->format('Y-m-d H:i:s')
                ];
            });

            return response()->json([
                'status' => true,
                'message' => '獲取成功',
                'data' => $items->items(),
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total()
            ]);

        } catch (\Exception $e) {
            \Log::error('Get business items list error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '獲取失敗：' . $e->getMessage()
            ]);
        }
    }
    
    //取得業務項目資訊
    public function getBusinessItemInfo(Request $request)
    {
        $businessItem = BusinessItem::with('branch')->find($request->id);
        if (!$businessItem) {
            return response()->json([
                'status' => false,
                'message' => '業務項目不存在'
            ]);
        }

        $data = [
            'id' => $businessItem->id,
            'number' => $businessItem->number,
            'name' => $businessItem->name,
            'price' => $businessItem->price,       // 新增
            'deposit' => $businessItem->deposit,   // 新增
            'branch_id' => $businessItem->branch_id,
            'branch_name' => $businessItem->branch ? $businessItem->branch->name : null,
            'status' => $businessItem->status,
            'remarks' => $businessItem->remarks,
            'created_at' => $businessItem->created_at,
            'updated_at' => $businessItem->updated_at
        ];

        return response()->json([
            'status' => true,
            'message' => '獲取成功',
            'data' => $data
        ]);
    }

    //取得Line Bot設定列表
    public function getLineBotList(Request $request)
    {
        try {
            $lineBots = LineBot::with('branch')->get();

            // 修改資料轉換部分
            $lineBots->transform(function ($item) {
                return [
                    'id' => $item->id,
                    'branch_id' => $item->branch_id,
                    'branch_name' => $item->branch ? $item->branch->name : null,
                    'channel_secret' => $item->channel_secret,
                    'channel_token' => $item->channel_token,
                    'liff_id' => $item->liff_id,
                    'payment_notice' => $item->payment_notice,
                    'renewql_notice' => $item->renewql_notice,
                ];
            });
            
            return response()->json([
                'status' => true,
                'message' => '獲取成功',
                'data' => $lineBots
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '獲取失敗：' . $e->getMessage()
            ]);
        }
    }

    //修改Line Bot設定
    public function updateLineBot(Request $request)
    {
        try {
            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }
            $lineBot = LineBot::find($request->id);
            if (!$lineBot) {
                return response()->json([
                    'status' => false,
                    'message' => 'Line Bot設定不存在'
                ]);
            }

            $lineBot->update($request->all());

            //20250307
            $systemlog_description = '[修改Line Bot設定] 場館:'.$lineBot->branch->name.' 頻道密鑰:'.$lineBot->channel_secret.' 頻道Token:'.$lineBot->channel_token.' 頻道Liff ID:'.$lineBot->liff_id.' 付款通知:'.$lineBot->payment_notice.' 續約通知:'.$lineBot->renewql_notice;
            $this->createSystemLog($member->id, '修改', $systemlog_description, 'line_bots', $lineBot->id, 'update');

            return response()->json([
                'status' => true,
                'message' => '修改成功'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '修改失敗：' . $e->getMessage()
            ]);
        }
    }

    //新增合約
    public function createProject(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            // 驗證必填欄位
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
                return response()->json([
                    'status' => false,
                    'message' => $validator->errors()->first()
                ]);
            }

            // 驗證業務項目是否存在
            $businessItem = BusinessItem::find($request->business_item_id);
            if (!$businessItem) {
                return response()->json([
                    'status' => false,
                    'message' => '業務項目不存在'
                ]);
            }

            // 驗證客戶是否存在
            $customer = Customer::find($request->customer_id);
            if (!$customer) {
                return response()->json([
                    'status' => false,
                    'message' => '客戶不存在'
                ]);
            }

            // 創建新專案
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

            //20250307
            $systemlog_description = '[新增合約] 合約名稱:'.$project->projectName.' 業務項目:'.$businessItem->name.' 客戶:'.$customer->name.' 開始日期:'.$project->start_day.' 結束日期:'.$project->end_day.' 簽約日期:'.$project->signing_day.' 繳費日:'.$project->pay_day.' 付款方案:'.$project->payment_period.' 合約類型:'.$project->contractType.' 原價:'.$project->original_price.' 售價:'.$project->sale_price.' 押金:'.$project->deposit.' 違約金:'.$project->penaltyFee.' 滯納金:'.$project->lateFee.' 狀態:'.$project->status.' 備註:'.$project->remark;
            $this->createSystemLog($member->id, '新增', $systemlog_description, 'projects', $project->id, 'create');

            return response()->json([
                'status' => true,
                'message' => '新增成功',
                'data' => $project
            ]);
        } catch (\Exception $e) {
            \Log::error('Create project error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '新增失敗：' . $e->getMessage()
            ]);
        }
    }

    //修改合約
    public function updateProject(Request $request)
    {
        try {
            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            $project = Project::find($request->id);
            if (!$project) {
                return response()->json([
                    'status' => false,
                    'message' => '合約不存在'
                ]);
            }

            // 驗證業務項目
            if (empty($request->business_item_id)) {
                return response()->json([
                    'status' => false,
                    'message' => '業務項目ID不能為空'
                ]);
            }
            $businessItem = BusinessItem::find($request->business_item_id);
            if (!$businessItem) {
                return response()->json([
                    'status' => false,
                    'message' => '業務項目不存在'
                ]);
            }

            // 驗證客戶
            if (empty($request->customer_id)) {
                return response()->json([
                    'status' => false,
                    'message' => '客戶ID不能為空'
                ]);
            }
            $customer = Customer::find($request->customer_id);
            if (!$customer) {
                return response()->json([
                    'status' => false,
                    'message' => '客戶不存在'
                ]);
            }
             // 驗證必填欄位
            if (empty($request->start_day)) {
                return response()->json([
                    'status' => false,
                    'message' => '開始日期不能為空'
                ]);
            }
            if (empty($request->end_day)) {
                return response()->json([
                    'status' => false,
                    'message' => '合約到期日不能為空'
                ]);
            }
            if (empty($request->signing_day)) {
                return response()->json([
                    'status' => false,
                    'message' => '簽約日期不能為空'
                ]);
            }
            if (empty($request->pay_day)) {
                return response()->json([
                    'status' => false,
                    'message' => '約定繳費日不能為空'
                ]);
            }
            if (empty($request->payment_period)) {
                return response()->json([
                    'status' => false,
                    'message' => '付款方案不能為空'
                ]);
            }

            // 根據付款方案設定 cp 值
            $cp = 1; // 預設值
            switch ($request->payment_period) {
                case 1: $cp = 1; break;  // 月繳
                case 2: $cp = 3; break;  // 季繳
                case 3: $cp = 6; break;  // 半年繳
                case 4: $cp = 12; break; // 年繳
            }

            // 計算每期應繳和合約總金額
            //20250305
            $current_payment = $request->sale_price * $cp;
            $total_payment = $request->sale_price * $request->contractType * 12;

            // 更新合約資料
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

            //20250307
            $systemlog_description = '[修改合約] 合約名稱:'.$project->projectName.' 業務項目:'.$businessItem->name.' 客戶:'.$customer->name.' 開始日期:'.$project->start_day.' 結束日期:'.$project->end_day.' 簽約日期:'.$project->signing_day.' 繳費日:'.$project->pay_day.' 付款方案:'.$project->payment_period.' 合約類型:'.$project->contractType.' 原價:'.$project->original_price.' 售價:'.$project->sale_price.' 押金:'.$project->deposit.' 違約金:'.$project->penaltyFee.' 滯納金:'.$project->lateFee.' 狀態:'.$project->status.' 備註:'.$project->remark;
            $this->createSystemLog($member->id, '修改', $systemlog_description, 'projects', $project->id, 'update');

            return response()->json([
                'status' => true,
                'message' => '修改成功'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Update project error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '修改失敗：' . $e->getMessage()
            ]);
        }
    }

    //刪除合約
    public function deleteProject(Request $request)
    {
        try {
            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }
            $project = Project::find($request->id);
            if (!$project) {
                return response()->json([   
                    'status' => false,
                    'message' => '合約不存在'
                ]);
            }
            $project->delete();

            //20250307
            $systemlog_description = '[刪除合約] 合約名稱:'.$project->projectName.' 業務項目:'.$project->businessItem->name.' 客戶:'.$project->customer->name;
            $this->createSystemLog($member->id, '刪除', $systemlog_description, 'projects', $project->id, 'delete');

            return response()->json([
                'status' => true,
                'message' => '刪除成功'
            ]);
        } catch (\Exception $e) {
            \Log::error('Delete project error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '刪除失敗：' . $e->getMessage()
            ]);
        }
    }

    //取得合約列表
    public function getProjectList(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $keyword = $request->get('keyword');
            $branchId = $request->get('branch_id');

            $query = Project::with([
                'businessItem:id,name', 
                'customer', // 加載完整的客戶資訊
                'branch:id,name'
            ]);

            // 如果指定了分館ID，則只顯示該分館的數據
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            // 如果有關鍵字，添加搜尋條件
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

            // 轉換數據格式
            $projects->getCollection()->transform(function ($project) {
                $customer = $project->customer;
                return [
                    'id' => $project->id,
                    'projectName' => $project->projectName,
                    'businessItemName' => $project->businessItem->name ?? '未知業務項目',
                    'business_item_id' => $project->business_item_id,
                    'customerName' => $customer->name ?? '未知客戶',
                    'customer_id' => $project->customer_id,
                    'line_id' => $customer->line_id ?? null, // 添加 line_id
                    'line_nickname' => $customer->line_nickname ?? null, // 添加 line_nickname
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
                    'contract_path' => $project->contract_path, // 確保這個欄位有被選取
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
            return response()->json([
                'status' => false,
                'message' => '獲取失敗：' . $e->getMessage()
            ]);
        }
    }

    //取得合約內容
    public function getProjectInfo(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {  // 使用 is_null() 進行判斷
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            $project = Project::with(['customer', 'businessItem', 'branch'])
                ->find($request->id);

            if (!$project) {
                return response()->json([
                    'status' => false,
                    'message' => '合約不存在'
                ]);
            }

            // 檢查權限時使用具體的屬性比較
            if (!$member->is_top_account && $member->branch_id !== $project->branch_id) {
                return response()->json([
                    'status' => false,
                    'message' => '無權限查看此專案'
                ]);
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
    
            return response()->json([
                'status' => true,
                'message' => '獲取成功',
                'data' => $data
            ]);
    
        } catch (\Exception $e) {
            \Log::error('Get project info error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '獲取失敗：' . $e->getMessage()
            ]);
        }
    }

    private function transformContractStatus($contractStatus)
    {
        switch ($contractStatus) {
            case 0:
                $contractStatus = '未提交';
                break;
            case 1:
                $contractStatus = '審核中';
                break;
            case 2:
                $contractStatus = '已審核';
                break;
            case 3:
                $contractStatus = '未通過';
                break;
            default:
                $contractStatus = '未知';
                break;
        }
        return $contractStatus;
    }
    
    // private function transformPaymentPlan($paymentPlan)
    // {
    //     switch ($paymentPlan) {
    //         case 'monthly':
    //             $paymentPlan = 1;
    //             break;
    //         case 'quarterly':
    //             $paymentPlan = 2;
    //             break;
    //         case 'semiannual':
    //             $paymentPlan = 3;
    //             break;
    //         case 'annual':
    //             $paymentPlan = 4;
    //             break;
    //         case 1:
    //             $paymentPlan = 'monthly';
    //             break;
    //         case 2:
    //             $paymentPlan = 'quarterly';
    //             break;
    //         case 3:
    //             $paymentPlan = 'semiannual';
    //             break;
    //         case 4:
    //             $paymentPlan = 'annual';
    //             break;
    //     }
    //     return $paymentPlan;
    // }
    
    //獲取系統設定
    public function getConfig()
    {
        try {
            $config = Config::first();
            
            if (!$config) {
                // 如果沒有配置，創建默認配置
                $config = Config::create([
                    'overdue_days' => 5,
                    'late_fee' => '3',
                    'penalty_fee' => 6000,
                    'hash_key' => '',
                    'hash_iv' => '',
                    'validate' => '',
                    'callback_url' => '',
                    'line_webhook_url' => ''
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => '獲取成功',
                'data' => $config
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '獲取失敗：' . $e->getMessage()
            ]);
        }
    }

    //更新系統設定
    public function updateConfig(Request $request)
    {
        try {
            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }
            $config = Config::first();
            
            if (!$config) {
                $config = new Config();
            }

            // 驗證數據
            if (isset($request->overdue_days) && $request->overdue_days < 0) {
                return response()->json([
                    'status' => false,
                    'message' => '逾期通知天數不能小於0'
                ]);
            }

            if (isset($request->penalty_fee) && $request->penalty_fee < 0) {
                return response()->json([
                    'status' => false,
                    'message' => '違約金不能小於0'
                ]);
            }

            if (isset($request->late_fee) && $request->late_fee < 0) {
                return response()->json([
                    'status' => false,
                    'message' => '滯納金(%)不能小於0'
                ]);
            }
            // 更新配置
            $config->fill($request->all());
            $config->save();

            //20250307
            $systemlog_description = '[修改系統設定] 逾期通知天數:'.$request->overdue_days.' 滯納金(%):'.$request->late_fee.' 違約金:'.$request->penalty_fee;
            $this->createSystemLog($member->id, '修改', $systemlog_description, 'configs', $config->id, 'update');

            return response()->json([
                'status' => true,
                'message' => '更新成功'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '更新失敗：' . $e->getMessage()
            ]);
        }
    }

    //處理照片上傳
    private function handleImageUpload($image, $savePath,$id)
    {
        try {
            if (!$image->isValid()) {
                throw new \Exception('無效的圖片文件');
            }

            $imageName = time() . $image->getClientOriginalName();
            $path = $savePath.'/'.$id;
            // 檢查目錄是否存在,不存在則建立
            if (!Storage::disk('public')->exists($path)) {
                Storage::disk('public')->makeDirectory($path);
            }
            $path = $image->storeAs($path, $imageName, 'public');
            
            if (!$path) {
                throw new \Exception('圖片保存失敗');
            }

            return $path;
        } catch (\Exception $e) {
            \Log::error('Image upload error: ' . $e->getMessage());
            throw $e;
        }
    }

    //新增繳費歷程
    public function createPaymentHistory(Request $request)
    {
        //驗證參數
        // 'project_id', 
        // 'customer_id',
        // 'branch_id',
        // 'pay_day',
        // 'pay_type',
        // 'amount',
        // 'remark',

        $member = $this->isLogin();
        if(is_null($member)){
            return response()->json([
                'status' => false,
                'message' => '未登入'
            ]);
        }

        if(empty($request->project_id)){
            return response()->json([
                'status' => false,
                'message' => '合約ID不能為空'
            ]);
        }

        $project = Project::find($request->project_id);
        if(!$project){
            return response()->json([
                'status' => false,
                'message' => '合約不存在'
            ]);
        }

        if(empty($request->pay_day)){
            return response()->json([
                'status' => false,
                'message' => '繳費日期不能為空'
            ]);
        }

        if(empty($request->pay_type)){
            return response()->json([
                'status' => false,
                'message' => '繳費方式不能為空'
            ]);
        }

        if(empty($request->amount)){
            return response()->json([
                'status' => false,
                'message' => '繳費金額不能為空'
            ]);
        }

        if($request->amount < 0){
            return response()->json([
                'status' => false,
                'message' => '繳費金額不能小於0'
            ]);
        }

        $paymentHistory = new PaymentHistory();
        $paymentHistory->fill(
            [
                'project_id' => $request->project_id,
                'customer_id' => $project->customer_id,
                'branch_id' => $project->branch_id,
                'pay_day' => date('Y-m-d'),
                'pay_type' => $request->pay_type,
                'amount' => $request->amount,
                'remark' => $request->remark
            ]
        );
        $paymentHistory->save();

        //更新合約最後付款日期和下次付款日期
        $project->last_pay_day = date('Y-m-d');
        switch($project->payment_period){
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

        //20250307
        $customer = Customer::find($project->customer_id);
        $systemlog_description = '[新增繳費歷程] 合約名稱:'.$project->projectName.' 客戶名稱:'.$customer->name.' 繳費日期:'.$request->pay_day.' 繳費方式:'.$request->pay_type.' 繳費金額:'.$request->amount.' 備註:'.$request->remark;

        $this->createSystemLog($member->id, '新增', $systemlog_description, 'payment_histories', $paymentHistory->id, 'create');

        return response()->json([
            'status' => true,
            'message' => '新增成功'
        ]);
    }
    
    //列出繳費歷程
    public function getPaymentHistoryList(Request $request)
    {
        // $member = $this->isLogin();
        // if(is_null($member)){
        //     return response()->json([
        //         'status' => false,
        //         'message' => '未登入'
        //     ]);
        // }

        // $member = Member::find('aa1111');

        // $brach_id = $member->branch_id;
        // if($member->is_top_account == 1){
        //     $paymentHistory = PaymentHistory::all();
        // }else{
        //     $paymentHistory = PaymentHistory::where('branch_id', $brach_id)->get();
        // }

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

        //依時間範圍查詢
        if(!empty($start_day)){
            $paymentHistory->where('payment_histories.pay_day', '>=', $start_day);
        }
        if(!empty($end_day)){
            $paymentHistory->where('payment_histories.pay_day', '<=', $end_day);
        }

        //依繳費日期查詢
        if(!empty($pay_day)){
            $paymentHistory->where('payment_histories.pay_day', $pay_day);
        }

        //依管別查詢
        if(!empty($branch_id)){
            $paymentHistory->where('payment_histories.branch_id', $branch_id);
        }

        //依專案查詢
        if(!empty($project_id)){
            $paymentHistory->where('payment_histories.project_id', $project_id);
        }

        //依客戶查詢
        if(!empty($customer_id)){
            $paymentHistory->where('payment_histories.customer_id', $customer_id);
        }

        //依業務項目查詢
        if(!empty($business_item_id)){
            $paymentHistory->where('payment_histories.business_item', $business_item_id);
        }

        //依關鍵字查詢
        if(!empty($keyword)){
            $paymentHistory->where(function($query) use ($keyword) {
                $query->where('customers.name', 'like', "%{$keyword}%")
                    ->orWhere('customers.company_name', 'like', "%{$keyword}%")
                    ->orWhere('business_items.name', 'like', "%{$keyword}%")
                    ->orWhere('branches.name', 'like', "%{$keyword}%")
                    ->orWhere('projects.projectName', 'like', "%{$keyword}%")
                    ->orWhere('payment_histories.pay_type', 'like', "%{$keyword}%");
            });
        }

        $paymentHistory = $paymentHistory->get()->map(function($item){
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
                'remark' => $item->remark??'',
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

    //驗證是否登入
    protected function isLogin()
    {
        try {
            $token = request()->header('Authorization');
            if (empty($token)) {
                return null;
            }
            $token = str_replace('Bearer ', '', $token);
            $member = Member::where('token', $token)->first();
            return $member ?: null;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function confirmContract(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            $validator = Validator::make($request->all(), [
                'project_id' => 'required|exists:projects,id',
                'signature' => 'required|string', // Base64 格式的簽名圖片
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => $validator->errors()->first()
                ]);
            }

            // 獲取專案資訊
            $project = Project::find($request->project_id);

            // 檢查權限
            if (!$member->is_top_account && $member->branch_id !== $project->branch_id) {
                return response()->json([
                    'status' => false,
                    'message' => '無權限確認此合約'
                ]);
            }

            // 儲存簽名圖片
            $signatureImage = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $request->signature));
            $signatureimg = $project->customer_id . '_' . time() . '.png';
            $signaturePath = 'signatures/' . $project->customer_id;
            if (!Storage::disk('public')->exists($signaturePath)) {
                Storage::disk('public')->makeDirectory($signaturePath);
            }
            Storage::disk('public')->put($signaturePath . '/' . $signatureimg, $signatureImage);

            // 更新專案狀態
            $project->fill([
                'contract_status' => 1, // 已確認
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
            return response()->json([
                'status' => false,
                'message' => '確認失敗：' . $e->getMessage()
            ]);
        }
    }

    public function uploadContractPdf(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            $validator = Validator::make($request->all(), [
                'project_id' => 'required|exists:projects,id',
                'pdf_file' => 'required|string', // Base64 格式的 PDF 文件
                'signature' => 'required|string', // Base64 格式的簽名
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => $validator->errors()->first()
                ]);
            }

            // 獲取專案資訊
            $project = Project::find($request->project_id);

            // 檢查權限
            //if (!$member->is_top_account && $member->branch_id !== $project->branch_id) {
            if (!$member->is_top_account && $member->branch_id !== $project->branch_id) {
                return response()->json([
                    'status' => false,
                    'message' => '無權限上傳此合約'
                ]);
            }

            // 儲存 PDF 文件
            $pdfData = base64_decode(preg_replace('#^data:application/pdf;base64,#i', '', $request->pdf_file));

            // 修改 PDF 文件名格式
            $pdf_name = $project->customer_id . '_' . time() . '.pdf';
            $pdfPath = 'contracts/' . $project->customer_id;
            if (!Storage::disk('public')->exists($pdfPath)) {
                Storage::disk('public')->makeDirectory($pdfPath);
            }
            Storage::disk('public')->put($pdfPath . '/' . $pdf_name, $pdfData);

            // 儲存簽名圖片
            $signatureImage = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $request->signature));

            // 修改簽名文件名格式
            $signature_name = $project->customer_id . '_' . time() . '.png';
            $signaturePath = 'signatures/' . $project->customer_id;
            if (!Storage::disk('public')->exists($signaturePath)) {
                Storage::disk('public')->makeDirectory($signaturePath);
            }
            Storage::disk('public')->put($signaturePath . '/' . $signature_name, $signatureImage);

            // 更新專案狀態
            $project->fill([
                'contract_status' => 4, // 已確認
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
            return response()->json([
                'status' => false,
                'message' => '上傳失敗：' . $e->getMessage()
            ]);
        }
    }

    public function downloadContract($projectId)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            $project = Project::find($projectId);
            
            // 檢查權限
            if (!$member->is_top_account && $member->branch_id !== $project->branch_id) {
                return response()->json([
                    'status' => false,
                    'message' => '無權限下載此合約'
                ]);
            }

            // 檢查文件是否存在
            if (!Storage::disk('public')->exists($project->contract_path)) {
                return response()->json([
                    'status' => false,
                    'message' => '合約文件不存在'
                ]);
            }

            // 生成下載時的文件名
            $downloadFileName = 'contract_' . $project->id . '_' . time() . '.pdf';

            // 返回文件，並使用新的文件名
            return Storage::disk('public')->download(
                $project->contract_path, 
                $downloadFileName
            );
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '下載失敗：' . $e->getMessage()
            ]);
        }
    }

    public function dashboard(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            // 使用快取 (每 30 分鐘更新一次)
            $cacheKey = 'dashboard_' . ($member->is_top_account ? 'all' : $member->branch_id);
            $cacheTTL = 30 * 60; // 30 分鐘

            $data = \Cache::remember($cacheKey, $cacheTTL, function () use ($member) {
                return $this->calculateDashboardData($member);
            });

            return response()->json([
                'status' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '獲取資料失敗：' . $e->getMessage()
            ]);
        }
    }

    /**
     * 計算 Dashboard 數據（優化版本）
     * 只執行 2 次資料庫查詢，其餘在 PHP 內計算
     */
    private function calculateDashboardData($member)
    {
        $currentYear = (int)date('Y');
        $currentMonth = (int)date('m');

        // ========== 只查詢 2 次資料庫 ==========

        // 查詢 1：一次性載入所有相關 Projects
        $projectQuery = Project::query();
        if (!$member->is_top_account) {
            $projectQuery->where('branch_id', $member->branch_id);
        }
        $projects = $projectQuery->get();
        $projectIds = $projects->pluck('id')->toArray();

        // 查詢 2：一次性載入過去 12 個月的 PaymentHistory
        $twelveMonthsAgo = date('Y-m-01', strtotime('-11 months'));
        $payments = PaymentHistory::whereIn('project_id', $projectIds)
            ->where('pay_day', '>=', $twelveMonthsAgo)
            ->get()
            ->groupBy(function($payment) {
                return date('Y-m', strtotime($payment->pay_day));
            });

        // ========== PHP 內計算 ==========

        $charts = [
            'month' => [],
            'receivable' => [],
            'receipt' => [],
            'unpaid' => []
        ];

        // 計算過去 12 個月的數據
        for ($i = 11; $i >= 0; $i--) {
            $targetDate = strtotime("-{$i} months");
            $year = (int)date('Y', $targetDate);
            $month = (int)date('m', $targetDate);
            $monthKey = sprintf('%d-%02d', $year, $month);
            $startDate = "{$monthKey}-01";
            $endDate = date('Y-m-t', strtotime($startDate));

            // 計算該月應收款項
            $receivable = 0;
            foreach ($projects as $project) {
                if ($this->shouldPayInMonth($project, $startDate, $endDate)) {
                    $receivable += $project->current_payment;
                }
            }

            // 計算該月實收款項
            $receipt = 0;
            if (isset($payments[$monthKey])) {
                $receipt = $payments[$monthKey]->sum('amount');
            }

            // 計算未收款項（截至該月底）
            $unpaid = 0;
            foreach ($projects as $project) {
                if (!$project->next_pay_day) continue;
                // 確保日期格式統一
                $nextPayDay = is_string($project->next_pay_day) ? $project->next_pay_day : $project->next_pay_day->format('Y-m-d');
                if (strtotime($nextPayDay) <= strtotime($endDate)) {
                    $unpaid += ($project->current_payment ?? 0);
                }
            }

            $charts['month'][] = date('M', strtotime($startDate));
            $charts['receivable'][] = round($receivable);
            $charts['receipt'][] = round($receipt);
            $charts['unpaid'][] = round($unpaid);
        }

        // 計算本月統計
        $thisMonthStart = date('Y-m-01');
        $thisMonthEnd = date('Y-m-t');
        $thisMonthKey = date('Y-m');

        $this_month_receivable = $projects->filter(function($p) use ($thisMonthStart, $thisMonthEnd) {
            if (!$p->next_pay_day) return false;
            // 確保日期格式統一
            $nextPayDay = is_string($p->next_pay_day) ? $p->next_pay_day : $p->next_pay_day->format('Y-m-d');
            return $nextPayDay >= $thisMonthStart && $nextPayDay <= $thisMonthEnd;
        })->sum('current_payment');

        $this_month_receipt = isset($payments[$thisMonthKey])
            ? $payments[$thisMonthKey]->sum('amount')
            : 0;

        // 計算本年統計
        $thisYearStart = date('Y-01-01');
        $thisYearEnd = date('Y-12-31');

        // 年度應收：遍歷今年每個月，計算該月的應收款項總和
        $this_year_receivable = 0;
        for ($month = 1; $month <= 12; $month++) {
            $monthStart = sprintf('%s-%02d-01', date('Y'), $month);
            $monthEnd = date('Y-m-t', strtotime($monthStart));

            foreach ($projects as $project) {
                if ($this->shouldPayInMonth($project, $monthStart, $monthEnd)) {
                    $this_year_receivable += ($project->current_payment ?? 0);
                }
            }
        }

        $this_year_receipt = 0;
        foreach ($payments as $monthPayments) {
            foreach ($monthPayments as $payment) {
                if ($payment->pay_day >= $thisYearStart && $payment->pay_day <= $thisYearEnd) {
                    $this_year_receipt += $payment->amount;
                }
            }
        }

        return [
            'charts' => $charts,
            'this_month_receivable' => (int)$this_month_receivable,
            'this_month_receipt' => (int)$this_month_receipt,
            'this_month_unpaid' => (int)($this_month_receivable - $this_month_receipt),
            'this_year_receivable' => (int)$this_year_receivable,
            'this_year_receipt' => (int)$this_year_receipt,
            'this_year_unpaid' => (int)($this_year_receivable - $this_year_receipt),
        ];
    }

    /**
     * 判斷該專案在指定月份是否需要付款
     */
    private function shouldPayInMonth($project, $startDate, $endDate)
    {
        // 確保日期格式統一（轉換為字串進行比較）
        $projectStart = $project->start_day ? (is_string($project->start_day) ? $project->start_day : $project->start_day->format('Y-m-d')) : null;
        $projectEnd = $project->end_day ? (is_string($project->end_day) ? $project->end_day : $project->end_day->format('Y-m-d')) : null;
        $nextPayDay = $project->next_pay_day ? (is_string($project->next_pay_day) ? $project->next_pay_day : $project->next_pay_day->format('Y-m-d')) : null;

        // 如果沒有合約起訖日，但有 next_pay_day，使用 next_pay_day 判斷
        if (!$projectStart || !$projectEnd) {
            if ($nextPayDay) {
                // 使用 next_pay_day 和付款週期來推算
                $periodMonths = match((int)$project->payment_period) {
                    1 => 1,   // 月繳
                    2 => 3,   // 季繳
                    3 => 6,   // 半年繳
                    4 => 12,  // 年繳
                    default => 1
                };

                $targetMonth = date('Y-m', strtotime($startDate));
                $nextPayMonth = date('Y-m', strtotime($nextPayDay));

                // 如果 next_pay_day 就在目標月份
                if ($nextPayMonth === $targetMonth) {
                    return true;
                }

                // 檢查目標月份是否在付款週期內
                $nextPayTimestamp = strtotime($nextPayDay);
                $targetTimestamp = strtotime($startDate);

                // 向前和向後推算付款日期
                $checkDate = $nextPayTimestamp;

                // 向後推算（未來的付款日）
                while ($checkDate <= strtotime($endDate) + (365 * 24 * 60 * 60)) {
                    if (date('Y-m', $checkDate) === $targetMonth) {
                        return true;
                    }
                    $checkDate = strtotime("+{$periodMonths} months", $checkDate);
                }

                // 向前推算（過去的付款日）
                $checkDate = strtotime("-{$periodMonths} months", $nextPayTimestamp);
                while ($checkDate >= strtotime($startDate) - (365 * 24 * 60 * 60)) {
                    if (date('Y-m', $checkDate) === $targetMonth) {
                        return true;
                    }
                    $checkDate = strtotime("-{$periodMonths} months", $checkDate);
                }

                return false;
            }
            return false;
        }

        // 檢查合約期間是否與該月重疊
        if ($projectStart > $endDate || $projectEnd < $startDate) {
            return false;
        }

        // 計算付款週期月數
        $periodMonths = match((int)$project->payment_period) {
            1 => 1,   // 月繳
            2 => 3,   // 季繳
            3 => 6,   // 半年繳
            4 => 12,  // 年繳
            default => 1
        };

        // 從合約開始日計算所有付款日
        $payDay = strtotime($projectStart);
        $targetMonth = date('Y-m', strtotime($startDate));
        $endTimestamp = strtotime($endDate);

        while ($payDay <= $endTimestamp) {
            if (date('Y-m', $payDay) === $targetMonth) {
                return true;
            }
            $payDay = strtotime("+{$periodMonths} months", $payDay);
        }

        return false;
    }

    /**
     * 計算專案的年度應收款項
     */
    private function calculateYearlyReceivable($project, $yearStart, $yearEnd)
    {
        // 確保日期格式統一（轉換為字串進行比較）
        $projectStart = $project->start_day ? (is_string($project->start_day) ? $project->start_day : $project->start_day->format('Y-m-d')) : null;
        $projectEnd = $project->end_day ? (is_string($project->end_day) ? $project->end_day : $project->end_day->format('Y-m-d')) : null;

        // 如果沒有合約起訖日，返回 0
        if (!$projectStart || !$projectEnd) {
            return 0;
        }

        // 檢查合約期間是否與該年重疊
        if ($projectStart > $yearEnd || $projectEnd < $yearStart) {
            return 0;
        }

        // 計算實際重疊期間
        $start = max($projectStart, $yearStart);
        $end = min($projectEnd, $yearEnd);

        $startMonth = (int)date('n', strtotime($start));
        $endMonth = (int)date('n', strtotime($end));
        $months = $endMonth - $startMonth + 1;

        // 根據付款方案計算年度內的付款次數
        $payments = match((int)$project->payment_period) {
            1 => $months,              // 月繳
            2 => ceil($months / 3),    // 季繳
            3 => ceil($months / 6),    // 半年繳
            4 => ceil($months / 12),   // 年繳
            default => 0
        };

        return ($project->current_payment ?? 0) * $payments;
    }

    /**
     * 清除 Dashboard 快取並重新計算
     */
    public function refreshDashboard(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            // 清除所有 Dashboard 快取
            \Cache::forget('dashboard_all');

            // 清除各分館的快取
            $branches = \App\Models\Branch::all();
            foreach ($branches as $branch) {
                \Cache::forget('dashboard_' . $branch->id);
            }

            // 重新計算當前用戶的 Dashboard
            $data = $this->calculateDashboardData($member);

            // 設置新快取
            $cacheKey = 'dashboard_' . ($member->is_top_account ? 'all' : $member->branch_id);
            \Cache::put($cacheKey, $data, 30 * 60);

            return response()->json([
                'status' => true,
                'message' => 'Dashboard 已刷新',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '刷新失敗：' . $e->getMessage()
            ]);
        }
    }

    //20250311
    //由前端觸發的Line訊息
    //須帶入customer_id 和 project_id 和 type
    //type = 1 催繳通知 type = 2 續約提醒通知
    public function sendLineMessage(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|string',
                'message' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => $validator->errors()->first()
                ]);
            }

            // 檢查用戶 ID 格式
            if (!preg_match('/^U[a-zA-Z0-9]{32}$/', $request->user_id)) {
                \Log::warning('Invalid LINE user ID format', [
                    'user_id' => $request->user_id
                ]);
            }

            $lineBot = new LineBotController();
            $result = $lineBot->sendMessage($request);

            if ($result) {
                return response()->json([
                    'status' => true,
                    'message' => '訊息發送成功'
                ]);
            }

            return response()->json([
                'status' => false,
                'message' => '訊息發送失敗'
            ]);

        } catch (\Exception $e) {
            \Log::error('Send LINE message error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => false,
                'message' => '發送失敗：' . $e->getMessage()
            ]);
        }
    }

    //20250311 新增
    // public function sendLineMessage(Request $request)
    // {
    //     try {
    //         if(is_null($request->project_id)){
    //             return response()->json([
    //                 'status' => false,
    //                 'message' => 'project_id 不能為空'
    //             ]);
    //         }

    //         if(is_null($request->type)){
    //             $type = 1;
    //         }else{
    //             $type = 2;
    //         }

    //         $project = Project::find($request->project_id);
    //         if(is_null($project)){
    //             return response()->json([
    //                 'status' => false,
    //                 'message' => '合約不存在'
    //             ]);
    //         }

    //         $line_bot_system = LineBot::where('branch_id', $project->branch_id)->first();
            
    //         $customer = Customer::find($project->customer_id);
    //         if($type == 1){
    //             //催繳通知
    //             // * 客戶名稱 [name] 下次繳費日 [next_pay_day] 專案名稱 [project_name] 應繳金額 [amount]
    //             $reply_message = $line_bot_system->payment_notice;
                
    //             $reply_message = str_replace('[name]', $customer->name, $reply_message);
    //             $reply_message = str_replace('[project_name]', $project->projectName, $reply_message);

    //             $next_pay_day = date('Y-m-d', strtotime($project->next_pay_day));
    //             $reply_message = str_replace('[next_pay_day]', $next_pay_day, $reply_message);

    //             $current_payment = number_format($project->current_payment);
    //             $reply_message = str_replace('[amount]', $current_payment, $reply_message);
    //         }else{
    //             //續約提醒
    //             // * 客戶名稱 [name] 到時日期 [end_day] 專案名稱 [project_name]
    //             $reply_message = $line_bot_system->renewql_notice;
    //             $reply_message = str_replace('[name]', $customer->name, $reply_message);

    //             $end_day = date('Y-m-d', strtotime($project->end_day));
    //             $reply_message = str_replace('[end_day]', $end_day, $reply_message);
    //             $reply_message = str_replace('[project_name]', $project->projectName, $reply_message);
    //         }

    //         if($customer->line_id != null){
    //             $line_id = $customer->line_id;
    //         }else{
    //             return response()->json([
    //                 'status' => false,
    //                 'message' => '客戶無Line ID'
    //             ]);
    //         }
            
    //         $data = [
    //             'user_id' => $line_id,
    //             'message' => $reply_message
    //         ];
            
    //         $request = new Request();
    //         $request->merge($data);

    //         $lineBot = new LineBotController();
    //         $result = $lineBot->sendMessage($request);

    //         if ($result) {
    //             return response()->json([
    //                 'status' => true,
    //                 'message' => '訊息發送成功'
    //             ]);
    //         }

    //         return response()->json([
    //             'status' => false,
    //             'message' => '訊息發送失敗'
    //         ]);

    //     } catch (\Exception $e) {
    //         \Log::error('Send LINE message error', [
    //             'error' => $e->getMessage(),
    //             'trace' => $e->getTraceAsString()
    //         ]);
    //         return response()->json([
    //             'status' => false,
    //             'message' => '發送失敗：' . $e->getMessage()
    //         ]);
    //     }
    // }

    //20250307
    //系統異動log
    private function createSystemLog($member_id,$action,$description,$sql_table,$sql_data_id,$sql_action)
    {
        $systemLog = new SystemLog();
        $systemLog->member_id = $member_id;
        $systemLog->action = $action;
        $systemLog->description = $description;
        $systemLog->sql_table = $sql_table;
        $systemLog->sql_data_id = $sql_data_id;
        $systemLog->sql_action = $sql_action;
        $systemLog->created_at = now();
        $systemLog->save();
    }
    
    //取得系統異動log
    public function getSystemLog(Request $request)
    {
        try {
            // $member = $this->isLogin();
            // if(is_null($member)){
            //     return response()->json([
            //         'status' => false,
            //         'message' => '未登入'
            //     ]);
            // }

            $start_day = $request->start_day;
            $end_day = $request->end_day;
            $sql_table = $request->sql_table;
            $sql_action = $request->sql_action;
            $branch_id = $request->branch_id;
            $search_member_account = $request->account;
            $keyword = $request->keyword;

            switch($sql_table){
                case 1: $sql_table = 'customers'; break;
                case 2: $sql_table = 'business_items'; break;
                case 3: $sql_table = 'projects'; break;
                case 4: $sql_table = 'branches'; break;
                case 5: $sql_table = 'members'; break;
                case 6: $sql_table = 'roles'; break;
                case 7: $sql_table = 'permissions'; break;
                case 8: $sql_table = 'payment_histories'; break;
                case 9: $sql_table = 'configs'; break;
                case 10: $sql_table = 'line_bots'; break;
                default: $sql_table = ''; break;
            }
            switch($sql_action){
                case 1: $sql_action = 'create'; break;
                case 2: $sql_action = 'update'; break;
                case 3: $sql_action = 'delete'; break;
                default: $sql_action = ''; break;
            }
            $systemLog = SystemLog::query()
            ->join('members', 'system_logs.member_id', '=', 'members.id')
            ->join('branches', 'members.branch_id', '=', 'branches.id')
            ->select(
                'system_logs.*',
                'members.account as member_account',
                'members.nickname as member_nickname',
                'members.branch_id as member_branch_id',
                'branches.name as branch_name'
            );

            if(!empty($start_day)){
                $systemLog->whereDate('system_logs.created_at', '>=', $start_day);
            }
            
            if(!empty($end_day)){
                $systemLog->whereDate('system_logs.created_at', '<=', $end_day);
            }
            
            if(!empty($sql_table)){
                $systemLog->where('system_logs.sql_table', $sql_table);
            }

            if(!empty($sql_action)){
                $systemLog->where('system_logs.sql_action', $sql_action);
            }

            if(!empty($branch_id)){
                $systemLog->where('members.branch_id', $branch_id);
            }

            if(!empty($search_member_account)){
                $systemLog->where('members.account', $search_member_account);
            }

            if(!empty($keyword)){
                $systemLog->where('system_logs.description', 'like', '%'.$keyword.'%');
            }

            $systemLog = $systemLog->get();
            return response()->json([
                'status' => true,
                'data' => $systemLog
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '獲取失敗：' . $e->getMessage()
            ]);
        }
    }

    //匯出客戶資料的範例
    public function exportCustomersExample()
    {
        $customers = collect([
            (object)[
                'number' => '123',
                'name' => '張小明',
                'birthday' => '1990-01-15',
                'phone' => '0912345678',
                'address' => '台北市中山區中山北路一段1號',
                'id_number' => 'A123456789',
                'email' => 'ming@gmail.com',
                'company_name' => '張小明科技股份有限公司',
                'company_number' => '12345678',
                'company_phone_number' => '02-12345678',
                'company_fax_number' => '02-12345678',
                'company_website' => 'www.ming.com',
                'company_email' => 'ming@gmail.com',
                'company_address' => '台北市中山區中山北路一段1號',
                'company_contact_person' => '張小明',
                'company_contact_person_phone_number' => '0912345678',
                'company_contact_person_email' => 'ming@gmail.com',
                'branch_name' => '台北總館',
                'line_id' => 'mingline',
                'line_nickname' => '小明',
                'remark' => '備註',
                'status' => '啟用',
                'created_at' => now()
            ],
            (object)[
                'number' => '124',
                'name' => '李大華',
                'birthday' => '1985-03-20',
                'phone' => '0923456789',
                'address' => '台北市大安區忠孝東路四段50號',
                'id_number' => 'B987654321',
                'email' => 'david@gmail.com',
                'company_name' => '創新企業有限公司',
                'company_number' => '87654321',
                'company_phone_number' => '02-12345678',
                'company_fax_number' => '02-12345678',
                'company_website' => 'www.david.com',
                'company_email' => 'david@gmail.com',
                'company_address' => '台北市大安區忠孝東路四段50號',
                'company_contact_person' => '李大華',
                'company_contact_person_phone_number' => '0923456789',
                'company_contact_person_email' => 'david@gmail.com',
                'branch_name' => '台北總館',
                'line_id' => 'davidlee',
                'line_nickname' => '大華',
                'remark' => '備註',
                'status' => '啟用',
                'created_at' => now()
            ],
            (object)[
                'number' => '125',
                'name' => '王美麗',
                'birthday' => '1988-12-25',
                'phone' => '0934567890',
                'address' => '新北市板橋區中山路200號',
                'id_number' => 'C456789012',
                'email' => 'meiwei@gmail.com',
                'company_name' => '優質貿易有限公司',
                'company_number' => '23456789',
                'company_phone_number' => '02-12345678',
                'company_fax_number' => '02-12345678',
                'company_website' => 'www.meiwei.com',
                'company_email' => 'meiwei@gmail.com',
                'company_address' => '新北市板橋區中山路200號',
                'company_contact_person' => '王美麗',
                'company_contact_person_phone_number' => '0934567890',
                'company_contact_person_email' => 'meiwei@gmail.com',
                'branch_name' => '台北總館',
                'line_id' => 'meiwei',
                'line_nickname' => '美麗',
                'remark' => '備註',
                'status' => '啟用',
                'created_at' => now()
            ]
        ]);
        return Excel::download(new CustomersExport($customers), '客戶資料範例.xlsx');
    }

    //匯出客戶資料
    public function exportCustomers(Request $request)
    {
        try {
            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            // 构建查询
            $query = Customer::query()
                ->leftJoin('branches', 'customers.branch_id', '=', 'branches.id')
                ->select(
                    'customers.*',
                    'branches.name as branch_name'
                );

            // 如果不是顶级账号，只能看到自己分馆的数据
            if (!$member->is_top_account) {
                $query->where('customers.branch_id', $member->branch_id);
            }

            // 如果有传入分馆 ID
            if ($request->has('branch_id')) {
                $query->where('customers.branch_id', $request->branch_id);
            }

            // 如果有关键字搜索
            if ($request->has('keyword')) {
                $keyword = $request->keyword;
                $query->where(function($q) use ($keyword) {
                    $q->where('customers.name', 'like', "%{$keyword}%")
                        ->orWhere('customers.phone', 'like', "%{$keyword}%")
                        ->orWhere('customers.email', 'like', "%{$keyword}%")
                        ->orWhere('customers.company_name', 'like', "%{$keyword}%");
                });
            }

            $customers = $query->get();

            // 创建系统日志
            $systemlog_description = '[匯出客戶資料] 匯出筆數:' . $customers->count();
            $this->createSystemLog($member->id, '匯出', $systemlog_description, 'customers', 0, 'export');

            // 生成文件名
            $fileName = '客戶資料_' . date('YmdHis') . '.xlsx';

            // 返回下载响应
            return Excel::download(new CustomersExport($customers), $fileName);

        } catch (\Exception $e) {
            \Log::error('Export customers error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '匯出失敗：' . $e->getMessage()
            ]);
        }
    }

    //匯入客戶資料
    public function importCustomers(Request $request)
    {
        try {
            if (!$request->hasFile('file')) {
                return response()->json([
                    'status' => false,
                    'message' => '請上傳檔案'
                ]);
            }

            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            $file = $request->file('file');

            // 2. 讀取Excel原始數據
            $rawData = Excel::toArray([], $file);
            
            // 驗證數據格式
            if (empty($rawData) || empty($rawData[0]) || count($rawData[0]) < 2) {
                return response()->json([
                    'status' => false,
                    'message' => '檔案格式不正確或沒有數據'
                ]);
            }

            \Log::info('rawData: ' . json_encode($rawData));

            // 3. 獲取表頭和數據行
            $headers = $rawData[0][0]; // 第一行作為標題
            $dataRows = array_slice($rawData[0], 1); // 從第二行開始的所有數據

            // 4. 開始事務處理
            DB::beginTransaction();
            $successCount = 0;
            $errorRows = [];

            // 5. 逐行處理數據
            foreach ($dataRows as $index => $row) {
                try {
                    // 創建欄位映射
                    $customerData = [];
                    for ($j = 0; $j < count($headers); $j++) {
                        if (isset($row[$j])) {
                            $headerKey = $headers[$j];
                            $customerData[$headerKey] = $row[$j];
                        }
                    }

                    $requiredFields = ['客戶編號', '客戶姓名', '生日', '電話', '地址', '身分證字號', '電子郵件', '公司名稱', '統一編號', '公司電話'];
                    foreach ($requiredFields as $field) {
                        if (!isset($customerData[$field])) {
                            $customerData[$field] = null;
                        }
                    }

                    if(empty($customerData['啟用狀態'])){
                        $status = 1;
                    }else{
                        if($customerData['啟用狀態'] == '啟用'){
                            $status = 1;
                        }else{
                            $status = 0;
                        }
                    }


                    //判斷是否有所屬分館，如果沒有就依匯入的使用者為主
                    // $branch_name = $customerData['所屬分館'] ?? $member->branch_name;
                    // $branch = Branch::where('name','like', '%'.$branch_name.'%')->first();

                    if (isset($customerData['所屬分館'])) {
                        // 如果 Excel 中有指定分馆，则通过名称精确查找
                        $branch = Branch::where('name', $customerData['所屬分館'])->first();
                        if (!$branch) {
                            throw new \Exception('找不到相對應的分館: ' . $customerData['所屬分館']);
                        }
                    } else {
                        // 如果没有指定分馆，直接使用上传者的分馆 ID
                        $branch = Branch::find($member->branch_id);
                        if (!$branch) {
                            throw new \Exception('找不到上傳者的分館訊息');
                        }
                    }
                    

                    if(empty($customerData['客戶編號'])){
                        $lastCustomer = Customer::orderBy('number', 'desc')->first();
                        // 從最後一筆編號取得數字部分並加1
                        if(empty($lastCustomer)){
                            $number = 1;
                        }else{
                            $lastNumber = intval(preg_replace('/[^0-9]/', '', $lastCustomer->number));
                            $number = $lastNumber + 1;
                        }
                        
                    }else{
                        $customer = Customer::where('number',$customerData['客戶編號'])->first();
                        if(!is_null($customer)){
                            // 取得目前最後一筆客戶編號
                            $lastCustomer = Customer::orderBy('number', 'desc')->first();
                            // 從最後一筆編號取得數字部分並加1
                            $lastNumber = intval(preg_replace('/[^0-9]/', '', $lastCustomer->number));
                            $number = $lastNumber + 1;
                        }else{
                            $number = $customerData['客戶編號'];
                        }
                    }
                    

                    // 創建客戶記錄
                    $customer = new Customer([
                        'number' => $number,
                        'name' => $customerData['客戶姓名'] ?? null,
                        'birthday' => array_key_exists('生日',$customerData) ? $this->formatDate($customerData['生日']) : null,
                        'phone' => $customerData['電話'] ?? null,
                        'address' => $customerData['地址'] ?? null,
                        'id_number' => $customerData['身分證字號'] ?? null,
                        'email' => $customerData['電子郵件'] ?? null,
                        'company_name' => $customerData['公司名稱'] ?? null,
                        'company_number' => $customerData['統一編號'] ?? null,
                        'company_phone_number' => $customerData['公司電話'] ?? null,
                        'company_fax_number' => $customerData['公司傳真'] ?? null,
                        'company_website' => $customerData['公司網站'] ?? null,
                        'company_email' => $customerData['公司電子郵件'] ?? null,
                        'company_address' => $customerData['公司地址'] ?? null,
                        'company_contact_person' => $customerData['聯絡人姓名'] ?? null,
                        'company_contact_person_phone_number' => $customerData['聯絡人電話'] ?? null,
                        'company_contact_person_email' => $customerData['聯絡人信箱'] ?? null,
                        'branch_id' => $branch->id,
                        'branch_name' => $branch->name,
                        'line_id' => $customerData['LineID'] ?? null,  // 修改這裡，改為 'LINE ID'
                        'line_nickname' => $customerData['Line暱稱'] ?? null,
                        'remark' => $customerData['備注'] ?? null,
                        'status' => $status,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    $customer->save();
                    $successCount++;


                    \Log::info('Customer birthday data:', [
                        'original' => $customerData['生日'],
                        'formatted' => $customer->birthday
                    ]);

                } catch (\Exception $e) {
                    // 記錄錯誤但繼續處理下一行
                    $errorRows[] = [
                        'row_index' => $index + 2,
                        'error' => $e->getMessage()
                    ];
                }
            }

            // 6. 提交事務
            DB::commit();
            
            // 7. 返回處理結果
            $response = [
                'status' => true,
                'message' => "成功導入 {$successCount} 筆客戶資料"
            ];
            
            // 如果有錯誤行，也一併返回
            if (!empty($errorRows)) {
                $response['warnings'] = "有 " . count($errorRows) . " 筆數據導入失敗";
                $response['error_rows'] = $errorRows;
            }

            // 創建系統日志
            $systemlog_description = '[匯入客戶資料] 匯入筆數:' . $successCount;
            $this->createSystemLog($member->id, '匯入', $systemlog_description, 'customers', 0, 'import');
            
            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('Import customers error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '匯入失敗：' . $e->getMessage()
            ]);
        }
    }

    //匯出業務項目的範例
    public function exportBusinessItemsExample()
    {
        $businessItems = collect([
            (object)[
                'number' => '1',
                'name' => '業務項目1',
                'price' => 1000,
                'deposit' => 100,
                'status' => '啟用',
                'remark' => '備註',
                'branch_name' => '台北總館',
                'created_at' => now()
            ],
            (object)[
                'number' => '2',
                'name' => '業務項目2',
                'price' => 2000,    
                'deposit' => 200,
                'status' => '啟用',
                'remark' => '備註',
                'branch_name' => '台北總館',
                'created_at' => now()
            ]
        ]);
        return Excel::download(new BusinessItemsExport($businessItems), '業務項目範例.xlsx');
    }

    //匯出業務項目
    public function exportBusinessItems(Request $request)
    {
        try {
            $member = $this->isLogin();
            if(is_null($member)){    
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            // 构建查询
            $query = BusinessItem::query()
                ->leftJoin('branches', 'business_items.branch_id', '=', 'branches.id')
                ->select(
                    'business_items.*',
                    'branches.name as branch_name'
                );

            // 如果不是顶级账号，只能看到自己分馆的数据
            if (!$member->is_top_account) {
                $query->where('business_items.branch_id', $member->branch_id);
            }

            // 如果有传入分馆 ID
            if ($request->has('branch_id')) {
                $query->where('business_items.branch_id', $request->branch_id);
            }

            $businessItems = $query->get();

            // 创建系统日志
            $systemlog_description = '[匯出業務項目] 匯出筆數:' . $businessItems->count();
            $this->createSystemLog($member->id, '匯出', $systemlog_description, 'business_items', 0, 'export');

            // 生成文件名
            $fileName = '業務項目_' . date('YmdHis') . '.xlsx';

            // 返回下载响应
            return Excel::download(new BusinessItemsExport($businessItems), $fileName);

        } catch (\Exception $e) {
            \Log::error('Export business items error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '匯出失敗：' . $e->getMessage()
            ]);
        }
    }

    //匯入業務項目
    public function importBusinessItems(Request $request)
    {
        try {
            if (!$request->hasFile('file')) {
                return response()->json([
                    'status' => false,
                    'message' => '請上傳檔案'
                ]);
            }

            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }

            $file = $request->file('file');

            // 2. 讀取Excel原始數據
            $rawData = Excel::toArray([], $file);
            
            // 驗證數據格式
            if (empty($rawData) || empty($rawData[0]) || count($rawData[0]) < 2) {
                return response()->json([
                    'status' => false,
                    'message' => '檔案格式不正確或沒有數據'
                ]);
            }

            \Log::info('rawData: ' . json_encode($rawData));

            // 3. 獲取表頭和數據行
            $headers = $rawData[0][0]; // 第一行作為標題
            $dataRows = array_slice($rawData[0], 1); // 從第二行開始的所有數據

            // 4. 開始事務處理
            DB::beginTransaction();
            $successCount = 0;
            $errorRows = [];

            // 5. 逐行處理數據
            foreach ($dataRows as $index => $row) {
                try {
                    // 創建欄位映射
                    $businessItemData = [];
                    for ($j = 0; $j < count($headers); $j++) {
                        if (isset($row[$j])) {
                            $headerKey = $headers[$j];
                            $businessItemData[$headerKey] = $row[$j];
                        }
                    }

                    if($businessItemData['啟用狀態'] == '啟用'){
                        $status = 1;
                    }else{
                        $status = 0;
                    }

                    //判斷是否有所屬分館，如果沒有就依匯入的使用者為主
                    $branch_name = $businessItemData['所屬分館'];
                    $branch = Branch::where('name','like', '%'.$branch_name.'%')->first();

                    if(!$branch){
                        $branch_id = $member->branch_id;
                    }else{
                        $branch_id = $branch->id;
                    }

                    if(empty($businessItemData['業務項目編號'])){
                        $lastBusinessItem = BusinessItem::orderBy('number', 'desc')->first();
                        $lastNumber = intval(preg_replace('/[^0-9]/', '', $lastBusinessItem->number));
                        $number = $lastNumber + 1;
                    }else{
                        $existingItem = BusinessItem::where('number', $businessItemData['業務項目編號'])->first();

                        if(is_null($existingItem)){
                            $lastBusinessItem = BusinessItem::orderBy('number', 'desc')->first();
                            $lastNumber = intval(preg_replace('/[^0-9]/', '', $lastBusinessItem->number));
                            $number = $lastNumber + 1;
                        }else{
                            $number = $businessItemData['業務項目編號'];
                        }
                    }

                    

                    // 創建業務項目記錄
                    $businessItem = new BusinessItem([
                        'number' => $number,
                        'name' => $businessItemData['業務項目名稱'] ?? null,
                        'price' => $businessItemData['定價'] ?? null,
                        'deposit' => $businessItemData['押金'] ?? null,
                        'status' => $status,
                        'remark' => $businessItemData['備註'] ?? null,
                        'branch_id' => $branch_id,
                        'created_at' => $this->formatDate($businessItemData['建立時間'], 'Y-m-d H:i:s') ?? now(),
                        'updated_at' => now()
                    ]);

                    $businessItem->save();
                    $successCount++;
                } catch (\Exception $e) {
                    // 記錄錯誤但繼續處理下一行
                    $errorRows[] = [
                        'row_index' => $index + 2,
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            // 6. 提交事務
            DB::commit();
            
            // 7. 返回處理結果
            $response = [
                'status' => true,
                'message' => "成功導入 {$successCount} 筆業務項目"
            ];
            
            // 如果有錯誤行，也一併返回
            if (!empty($errorRows)) {
                $response['warnings'] = "有 " . count($errorRows) . " 筆數據導入失敗";
                $response['error_rows'] = $errorRows;
            }

            // 創建系統日志
            $systemlog_description = '[匯入業務項目] 匯入筆數:' . $successCount;
            $this->createSystemLog($member->id, '匯入', $systemlog_description, 'business_items', 0, 'import');
            
            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('Import business items error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '匯入失敗：' . $e->getMessage()
            ]);
        }
    }

    //匯出專案範例
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

    //匯出專案
    public function exportProjects(Request $request)
    {
        try {
            $member = $this->isLogin();
            if(is_null($member)){    
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
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

            // 如果不是顶级账号，只能看到自己分馆的数据
            if (!$member->is_top_account) {
                $query->where('projects.branch_id', $member->branch_id);
            }

            $projects = $query->get();

            // 创建系统日志
            $systemlog_description = '[匯出專案] 匯出筆數:' . $projects->count();
            $this->createSystemLog($member->id, '匯出', $systemlog_description, 'projects', 0, 'export');
            
            // 生成文件名
            $fileName = '專案_' . date('YmdHis') . '.xlsx';
            // 返回下载响应
            return Excel::download(new ProjectsExport($projects), $fileName);

        } catch (\Exception $e) {
            \Log::error('Export projects error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '匯出失敗：' . $e->getMessage()
            ]);
        }
    }

    //匯入專案
    public function importProjects(Request $request)
    {
        try {
            if (!$request->hasFile('file')) {
                return response()->json([
                    'status' => false,
                    'message' => '請上傳檔案'
                ]);
            }

            $member = $this->isLogin();
            if(is_null($member)){
                return response()->json([
                    'status' => false,
                    'message' => '未登入'
                ]);
            }
            $file = $request->file('file');

            // 2. 讀取Excel原始數據
            $rawData = Excel::toArray([], $file);
            // 驗證數據格式
            if (empty($rawData) || empty($rawData[0]) || count($rawData[0]) < 2) {
                return response()->json([
                    'status' => false,
                    'message' => '檔案格式不正確或沒有數據'
                ]);
            }

            // 3. 獲取表頭和數據行
            $headers = $rawData[0][0]; // 第一行作為標題
            $dataRows = array_slice($rawData[0], 1); // 從第二行開始的所有數據

            // 4. 開始事務處理
            DB::beginTransaction();
            $successCount = 0;
            $errorRows = [];

            // 5. 逐行處理數據
            foreach ($dataRows as $index => $row) {
                try {
                    // 創建欄位映射
                    $projectData = [];
                    for ($j = 0; $j < count($headers); $j++) {
                        if (isset($row[$j])) {
                            $headerKey = $headers[$j];
                            $projectData[$headerKey] = $row[$j];
                        }
                    }

                    // 處理客戶
                    $customer = Customer::where('name', $projectData['客戶名稱'])->orWhere('company_name', $projectData['客戶公司名稱'])->first();
                    if(is_null($customer)){
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
                    $branch = Branch::where('name','like', '%'.$projectData['所屬館別'].'%')->first();

                    // 處理業務項目
                    $businessItem = BusinessItem::where('name','like', '%'.$projectData['商務項目'].'%')->where('branch_id', $branch->id)->first();

                    $status = $projectData['狀態'] == '啟用' ? 1 : 0;
                    switch($projectData['合約狀態']){
                        case '未提交':
                            $contract_status = 0;
                            break;
                        case '審核中':
                            $contract_status = 1;
                            break;
                        case '已審核':
                            $contract_status = 2;
                            break;
                        case '未通過':
                            $contract_status = 3;
                            break;
                        default:
                            $contract_status = 0;
                    }
                    switch($projectData['付款方案']){
                        case '月繳':
                            $payment_period = 1;
                            break;
                        case '季繳':
                            $payment_period = 2;
                            break;
                        case '半年繳':
                            $payment_period = 3;
                            break;
                        case '年繳':
                            $payment_period = 4;
                            break;
                    }

                    // 從合約類型中提取數字
                    $contract_type = preg_replace('/[^0-9]/', '', $projectData['合約類型']);

                    // 創建專案記錄
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
                        'updated_at' =>  now()
                    ]);

                    $project->save();
                    $successCount++;
                } catch (\Exception $e) {
                    // 記錄錯誤但繼續處理下一行
                    $errorRows[] = [
                        'row_index' => $index + 2,
                        'error' => $e->getMessage()
                    ];
                }
            }

            // 提交事務
            DB::commit();

            // 返回處理的結果
            $response = [
                'status' => true,
                'message' => "成功導入 {$successCount} 筆專案"
            ];

            // 如果有錯誤行，也一併返回
            if (!empty($errorRows)) {
                $response['warnings'] = "有 " . count($errorRows) . " 筆數據導入失敗";
                $response['error_rows'] = $errorRows;
            }

            // 創建系統日志
            $systemlog_description = '[匯入專案] 匯入筆數:' . $successCount;
            $this->createSystemLog($member->id, '匯入', $systemlog_description, 'projects', 0, 'import');

            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('Import projects error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '匯入失敗：' . $e->getMessage()
            ]);
        }
    }

    // 匯入的日期格式修正
    private function formatDate($date, $format = 'Y-m-d')
    {
        if (empty($date)) {
            return null;
        }

        // 如果是 Excel 數字格式
        if (is_numeric($date)) {
            try {
                // Excel 日期轉換公式
                $unix_date = ($date - 25569) * 86400;
                $formatted = gmdate('Y-m-d', $unix_date);

                return $formatted;
            } catch (\Exception $e) {
                \Log::error('日期轉換失敗:', ['error' => $e->getMessage()]);
                return null;
            }
        }

        // 如果已經是 Y-m-d 格式
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }

        // 如果是字串格式且包含斜線 (例如 "1991/5/18")
        if (is_string($date) && strpos($date, '/') !== false) {
            $parts = explode('/', trim($date));
            if (count($parts) == 3) {
                $formatted = sprintf('%04d-%02d-%02d', 
                    intval($parts[0]),  // 年
                    intval($parts[1]),  // 月
                    intval($parts[2])   // 日
                );
                return $formatted;
            }
        }

        return null;
    }

    // 新增一個公開的API來獲取合約資料
    public function getPublicProjectInfo($projectId) 
    {
        try {
            $project = Project::with(['customer', 'businessItem', 'branch'])
                ->where('id', $projectId)
                ->first();

            if (!$project) {
                return response()->json([
                    'status' => false,
                    'message' => '找不到專案'
                ]);
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
            return response()->json([
                'status' => false,
                'message' => '獲取合約資料失敗'
            ]);
        }
    }

    public function getContractPdf($projectId)
    {
        try {
            $project = Project::findOrFail($projectId);
            
            if (!$project->contract_path) {
                return response()->json([
                    'status' => false,
                    'message' => '找不到合約文件路徑'
                ]);
            }

            // 構建完整的檔案路徑
            $filePath = storage_path('app/public/' . $project->contract_path);
            
            // 檢查文件是否存在
            if (!file_exists($filePath)) {
                return response()->json([
                    'status' => false,
                    'message' => '找不到合約文件'
                ]);
            }

            // 返回 PDF 文件
            return response()->file($filePath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="contract.pdf"'
            ]);

        } catch (\Exception $e) {
            \Log::error('Get contract PDF error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => '獲取合約失敗：' . $e->getMessage()
            ]);
        }
    }
}