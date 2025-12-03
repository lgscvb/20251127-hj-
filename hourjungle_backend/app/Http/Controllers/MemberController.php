<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\ApiHelperTrait;
use App\Models\Member;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * 用戶/權限管理控制器
 *
 * 處理：
 * - 前端會員認證（register, login, logout 等）
 * - 後台用戶管理（CRUD、權限、角色管理）
 */
class MemberController extends Controller
{
    use ApiHelperTrait;

    // ==================== 前端會員認證 ====================

    /**
     * 會員註冊
     */
    public function register(Request $request)
    {
        try {
            // 验证请求数据
            $request->validate([
                'account' => 'required|min:6|unique:members',
                'nickname' => 'required|min:6|max:12',
                'password' => 'required|min:6',
                'email' => 'required|email|unique:members',
                'phone' => 'required|digits:10'
            ]);

            // 创建新会员
            $member = Member::create([
                'account' => $request->account,
                'nickname' => $request->nickname,
                'password' => Hash::make($request->password),
                'email' => $request->email,
                'phone' => $request->phone,
                'token' => Str::random(60),
                'status' => 1,
            ]);

            return response()->json([
                'status' => true,
                'message' => '注册成功'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => '注册失败：' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 修改密碼（前端會員）
     */
    public function updatePassword(Request $request)
    {
        $member = Member::where('token', $request->header('Authorization'))->first();

        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '未授權的請求'
            ]);
        }

        // 檢查是否有提供舊密碼和新密碼
        if (empty($request->old_password) || empty($request->new_password)) {
            return response()->json([
                'status' => false,
                'message' => '舊密碼和新密碼不能為空'
            ]);
        }

        // 驗證舊密碼是否正確
        if (!Hash::check($request->old_password, $member->password)) {
            return response()->json([
                'status' => false,
                'message' => '舊密碼錯誤'
            ]);
        }

        // 檢查新密碼長度
        if (strlen($request->new_password) < 6) {
            return response()->json([
                'status' => false,
                'message' => '新密碼長度不得小於6個字'
            ]);
        }

        if($request->new_password == $request->old_password) {
            return response()->json([
                'status' => false,
                'message' => '新密碼不能與舊密碼相同'
            ]);
        }

        // 更新密碼
        $member->update([
            'password' => Hash::make($request->new_password),
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => true,
            'message' => '密碼修改成功'
        ]);
    }

    /**
     * 忘記密碼 - 驗證身份
     */
    public function forgotPassword(Request $request)
    {
        if (empty($request->account)) {
            return response()->json([
                'status' => false,
                'message' => '請輸入帳號'
            ]);
        }

        if (empty($request->verify_item)) {
            return response()->json([
                'status' => false,
                'message' => '請輸入Email或手機號碼'
            ]);
        }

        $member = Member::where('account', $request->account)->first();

        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '帳號不存在'
            ]);
        }

        // 判斷驗證項目是否為 Email 或電話號碼
        if (strpos($request->verify_item, '@') !== false) {
            if (!empty($request->verify_item) && $request->verify_item != $member->email) {
                return response()->json([
                    'status' => false,
                    'message' => 'Email驗證失敗'
                ]);
            }
        } else if (preg_match('/^[0-9]+$/', $request->verify_item)) {
            if (!empty($request->verify_item) && $request->verify_item != $member->phone) {
                return response()->json([
                    'status' => false,
                    'message' => '手機號碼驗證失敗'
                ]);
            }
        } else {
            return response()->json([
                'status' => false,
                'message' => '驗證項目格式不正確'
            ]);
        }


        // 生成重設密碼的臨時token
        $resetToken = Str::random(60);
        $member->update([
            'token' => $resetToken,
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => true,
            'message' => '身份驗證成功',
            'reset_token' => $resetToken
        ]);
    }

    /**
     * 忘記密碼 - 重設密碼
     */
    public function resetPassword(Request $request)
    {
        if (empty($request->reset_token)) {
            return response()->json([
                'status' => false,
                'message' => '無效的請求'
            ]);
        }

        $member = Member::where('token', $request->reset_token)->first();

        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '無效的重設密碼請求'
            ]);
        }

        if (empty($request->new_password)) {
            return response()->json([
                'status' => false,
                'message' => '請輸入新密碼'
            ]);
        }

        if (strlen($request->new_password) < 6) {
            return response()->json([
                'status' => false,
                'message' => '密碼長度不得小於6個字'
            ]);
        }

        // 更新密碼和token
        $member->update([
            'password' => Hash::make($request->new_password),
            'token' => Str::random(60),  // 生成新的token
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => true,
            'message' => '密碼重設成功'
        ]);
    }

    // ==================== 權限管理 ====================

    /**
     * 取得所有的權限項目
     */
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

    /**
     * 新增權限項目
     */
    public function createPermission(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        // 驗證請求參數
        if (empty($request->category) || empty($request->name)) {
            return $this->errorResponse('分類和名稱不能為空');
        }

        // 檢查該分類下是否已存在相同名稱的權限
        $existingPermission = Permission::where('category', $request->category)
            ->where('name', $request->name)->first();

        if ($existingPermission) {
            return $this->errorResponse('該分類下已存在相同名稱的權限');
        }

        $permission = Permission::create($request->all());

        $systemlog_description = '[新增權限] 權限名稱:'.$permission->name.' 權限分類:'.$permission->category;
        $this->createSystemLog($member->id, '新增', $systemlog_description, 'permissions', $permission->id, 'create');

        return $this->successResponse('新增成功');
    }

    /**
     * 刪除權限項目
     */
    public function deletePermission(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $permission = Permission::find($request->id);
        if (!$permission) {
            return $this->errorResponse('權限項目不存在');
        }

        $permission->delete();

        $systemlog_description = '[刪除權限] 權限名稱:'.$permission->name.' 權限分類:'.$permission->category;
        $this->createSystemLog($member->id, '刪除', $systemlog_description, 'permissions', $permission->id, 'delete');

        return $this->successResponse('刪除成功');
    }

    // ==================== 角色/群組管理 ====================

    /**
     * 取得所有的群組名稱
     */
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

    /**
     * 新增群組名稱
     */
    public function createRole(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        // 驗證請求參數
        if (empty($request->name)) {
            return $this->errorResponse('群組名稱不能為空');
        }

        // 檢查該群組名稱是否已存在
        $existingRole = Role::where('name', $request->name)->first();
        if ($existingRole) {
            return $this->errorResponse('該群組名稱已存在');
        }

        $role = Role::create($request->all());

        $systemlog_description = '[新增群組] 群組名稱:'.$role->name;
        $this->createSystemLog($member->id, '新增', $systemlog_description, 'roles', $role->id, 'create');

        return $this->successResponse('新增成功');
    }

    /**
     * 刪除群組名稱
     */
    public function deleteRole(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $role = Role::find($request->id);
        if (!$role) {
            return $this->errorResponse('群組名稱不存在');
        }

        $role->delete();

        $systemlog_description = '[刪除群組] 群組名稱:'.$role->name;
        $this->createSystemLog($member->id, '刪除', $systemlog_description, 'roles', $role->id, 'delete');

        return $this->successResponse('刪除成功');
    }

    /**
     * 修改群組名稱
     */
    public function modifyRole(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $role = Role::find($request->id);
        if (!$role) {
            return $this->errorResponse('群組不存在');
        }

        // 確保狀態值被正確更新
        $role->update([
            'name' => $request->name,
            'status' => (int)$request->status,
            'updated_at' => now()
        ]);

        $role_status = $role->status == 1 ? '啟用' : '停用';
        $systemlog_description = '[修改群組] 群組名稱:'.$role->name.' 群組狀態:'.$role_status;
        $this->createSystemLog($member->id, '修改', $systemlog_description, 'roles', $role->id, 'update');

        return $this->successResponse('修改成功');
    }

    /**
     * 建立或修改群組與權限的關聯
     */
    public function createOrUpdateRolePermission(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $role = Role::find($request->role_id);
        $permission_ids = explode(',', $request->permission_ids);
        $permissions = Permission::whereIn('id', $permission_ids)->get();
        if (!$role || !$permissions) {
            return $this->errorResponse('群組或權限不存在');
        }

        $role->permissions()->sync($permissions);

        $systemlog_description = '[建立或修改群組權限] 群組名稱:'.$role->name.' 權限:'.$permissions->pluck('name')->implode(',');
        $this->createSystemLog($member->id, '建立或修改', $systemlog_description, 'roles', $role->id, 'update');

        return $this->successResponse('建立成功');
    }

    // ==================== 後台用戶管理 ====================

    /**
     * 建立使用者會用到的資訊
     */
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

    /**
     * 建立使用者（後台管理）
     */
    public function createMember(Request $request)
    {
        $login_member = $this->isLogin();
        if (is_null($login_member)) {
            return $this->unauthorizedResponse();
        }

        try {
            // 驗證必填欄位
            if (empty($request->account)) {
                return $this->errorResponse('帳號不能為空');
            }

            if (empty($request->password)) {
                return $this->errorResponse('密碼不能為空');
            }

            // 檢查帳號是否已存在
            if (Member::where('account', $request->account)->exists()) {
                return $this->errorResponse('帳號已存在');
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
                'branch_id' => $request->branch_id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 設置角色關聯（這是多對多關係，所以使用 sync）
            if ($request->role_id) {
                $member->roles()->sync([$request->role_id]);
            }

            $member_status = $member->status == 1 ? '啟用' : '停用';
            $systemlog_description = '[新增使用者] 帳號:'.$member->account.' 暱稱:'.$member->nickname.' 電子郵件:'.$member->email.' 手機號碼:'.$member->phone.' 狀態:'.$member_status.' 群組:'.$member->role->name.' 場館:'.$member->branch->name;
            $this->createSystemLog($login_member->id, '新增', $systemlog_description, 'members', $member->id, 'create');

            return $this->successResponse('新增成功');
        } catch (\Exception $e) {
            return $this->errorResponse('新增失敗：' . $e->getMessage());
        }
    }

    /**
     * 修改使用者（後台管理）
     */
    public function updateMember(Request $request)
    {
        $login_member = $this->isLogin();
        if (is_null($login_member)) {
            return $this->unauthorizedResponse();
        }

        $member = Member::find($request->id);
        if (!$member) {
            return $this->errorResponse('使用者不存在');
        }

        if (empty($request->password)) {
            return $this->errorResponse('密碼不能為空');
        }

        if (empty($request->nickname)) {
            return $this->errorResponse('暱稱不能為空');
        }

        if (empty($request->role_id)) {
            return $this->errorResponse('群組不能為空');
        }

        $role = Role::find($request->role_id);
        if (!$role) {
            return $this->errorResponse('群組不存在');
        }

        if (empty($request->branch_id)) {
            return $this->errorResponse('場館不能為空');
        }

        // 檢查場館是否存在
        $branch = Branch::find($request->branch_id);
        if (!$branch) {
            return $this->errorResponse('場館不存在');
        }

        // 如果mail有值的話就驗證是否符合email格式
        if (!empty($request->email)) {
            if (!filter_var($request->email, FILTER_VALIDATE_EMAIL)) {
                return $this->errorResponse('電子郵件格式不正確');
            }
        }

        // 如果phone有值的話 就驗證格式是否符合phone格式
        if (!empty($request->phone)) {
            if (!preg_match('/^09\d{8}$/', $request->phone)) {
                return $this->errorResponse('手機號碼格式不正確');
            }
        }

        // 如果branch_id有值的話 就驗證是否符合branch_id格式
        if (!empty($request->branch_id)) {
            if (!is_numeric($request->branch_id)) {
                return $this->errorResponse('branch_id格式不正確');
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

        $member_status = $member->status == 1 ? '啟用' : '停用';
        $systemlog_description = '[修改使用者] 帳號:'.$member->account.' 暱稱:'.$member->nickname.' 電子郵件:'.$member->email.' 手機號碼:'.$member->phone.' 狀態:'.$member_status.' 群組:'.$member->role->name.' 場館:'.$member->branch->name;
        $this->createSystemLog($login_member->id, '修改', $systemlog_description, 'members', $member->id, 'update');

        return $this->successResponse('修改成功');
    }

    /**
     * 刪除使用者
     */
    public function deleteMember(Request $request)
    {
        $login_member = $this->isLogin();
        if (is_null($login_member)) {
            return $this->unauthorizedResponse();
        }

        $member = Member::find($request->id);
        if (!$member) {
            return $this->errorResponse('使用者不存在');
        }

        $member->delete();

        $systemlog_description = '[刪除使用者] 帳號:'.$member->account.' 暱稱:'.$member->nickname.' 電子郵件:'.$member->email.' 手機號碼:'.$member->phone.' 狀態:'.$member->status.' 群組:'.$member->role->name.' 場館:'.$member->branch->name;
        $this->createSystemLog($login_member->id, '刪除', $systemlog_description, 'members', $member->id, 'delete');

        return $this->successResponse('刪除成功');
    }

    /**
     * 取得使用者資訊
     */
    public function getMemberInfo(Request $request)
    {
        $member = Member::with('roles', 'branch')->find($request->id);
        if (!$member) {
            return $this->errorResponse('使用者不存在');
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

        return $this->successResponse('取得成功', $data);
    }

    /**
     * 修改使用者密碼（後台管理）
     */
    public function updateMemberPassword(Request $request)
    {
        $member = Member::find($request->id);
        if (!$member) {
            return $this->errorResponse('使用者不存在');
        }

        if (empty($request->password)) {
            return $this->errorResponse('密碼不能為空');
        }

        $member->password = Hash::make($request->password);
        $member->updated_at = now();
        $member->save();

        $systemlog_description = '[修改使用者密碼] 帳號:'.$member->account.' 密碼:'.$request->password;
        $this->createSystemLog($member->id, '修改', $systemlog_description, 'members', $member->id, 'update');

        return $this->successResponse('修改成功');
    }

    /**
     * 重置使用者密碼
     */
    public function resetMemberPassword(Request $request)
    {
        $login_member = $this->isLogin();
        if (is_null($login_member)) {
            return $this->unauthorizedResponse();
        }

        $member = Member::find($request->id);
        if (!$member) {
            return $this->errorResponse('使用者不存在');
        }

        $member->password = Hash::make('123456');
        $member->updated_at = now();
        $member->save();

        $systemlog_description = '[重置使用者密碼] 帳號:'.$member->account.' 密碼:123456';
        $this->createSystemLog($login_member->id, '修改', $systemlog_description, 'members', $member->id, 'update');

        return $this->successResponse('重置成功，密碼為123456');
    }

    /**
     * 取得所有使用者
     */
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
            return $this->errorResponse($e->getMessage());
        }
    }

    // ==================== 登入/登出 ====================

    /**
     * 登入（後台管理，包含權限）
     */
    public function login(Request $request)
    {
        // 檢查欄位是否為空值
        if (empty($request->account) || empty($request->password)) {
            return response()->json([
                'status' => false,
                'message' => '帳號和密碼不能為空'
            ]);
        }

        $member = Member::where('account', $request->account)->first();
        if (!$member) {
            return $this->errorResponse('使用者不存在');
        }

        if (Hash::check($request->password, $member->password)) {
            if ($member->status == 0) {
                return $this->errorResponse('使用者已停用');
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
                'permissions' => $permissions,
                'branch' => $member->branch ? $member->branch->name : '',
            ];

            return $this->successResponse('登入成功', $data);
        } else {
            return $this->errorResponse('密碼錯誤');
        }
    }

    /**
     * 登出
     */
    public function logout(Request $request)
    {
        $member = Member::find($request->id);
        if (!$member) {
            return $this->errorResponse('使用者不存在');
        }

        $member->token = null;
        $member->save();

        return $this->successResponse('登出成功');
    }
}
