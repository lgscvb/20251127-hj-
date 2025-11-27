<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MemberController extends Controller
{
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
     * 會員登入
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
            return response()->json([
                'status' => false,
                'message' => '帳號不存在'
            ]);
        }

        if (!Hash::check($request->password, $member->password)) {
            return response()->json([
                'status' => false,
                'message' => '密碼錯誤'
            ]);
        }

        if ($member->status != 1) {
            return response()->json([
                'status' => false,
                'message' => '帳號已被停用'
            ]);
        }

        // 更新登入時間和token
        $member->update([
            'last_login' => now(),
            'token' => Str::random(60)
        ]);

        return response()->json([
            'status' => true,
            'message' => '登入成功',
            'data' => [
                'id' => $member->id,
                'account' => $member->account,
                'nickname' => $member->nickname,
                'token' => $member->token,
                'last_login' => $member->last_login,
                'status' => $member->status,
                'created_at' => $member->created_at,
                'updated_at' => $member->updated_at,
                'email' => $member->email,
                'phone' => $member->phone,
            ]
        ]);
    }

    /**
     * 會員登出
     */
    public function logout(Request $request)
    {
        $member = Member::where('token', $request->header('Authorization'))->first();

        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '未授權的請求'
            ]);
        }

        // 清除會員的token
        $member->update([
            'token' => null
        ]);

        return response()->json([
            'status' => true,
            'message' => '登出成功'
        ]);
    }

    /**
     * 取得會員資料
     */
    public function getMemberInfo(Request $request)
    {
        $member = Member::where('token', $request->header('Authorization'))->first();

        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '未授權的請求'
            ]);
        }

        return response()->json([
            'status' => true,
            'data' => $member
        ]);
    }

    /**
     * 更新會員資料
     */
    public function updateMember(Request $request)
    {
        $member = Member::where('token', $request->header('Authorization'))->first();

        if (!$member) {
            return response()->json([
                'status' => false,
                'message' => '未授權的請求'
            ]);
        }

        // 檢查Email格式
        if ($request->email) {
            if (!filter_var($request->email, FILTER_VALIDATE_EMAIL)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Email格式不正確'
                ]);
            }

            $existingEmail = Member::where('email', $request->email)->first();
            if ($existingEmail) {
                return response()->json([
                    'status' => false,
                    'message' => '此 Email 已被使用'
                ]);
            }
        }

        // 檢查電話號碼格式
        if ($request->phone) {
            if (!preg_match('/^[0-9]+$/', $request->phone)) {
                return response()->json([
                    'status' => false,
                    'message' => '電話號碼格式不正確'
                ]);
            }

            $existingPhone = Member::where('phone', $request->phone)->first();
            if ($existingPhone) {
                return response()->json([
                    'status' => false,
                    'message' => '此電話號碼已被使用'
                ]);
            }
        }

        $member->update([
            'nickname' => $request->nickname ?? $member->nickname,
            'email' => $request->email ?? $member->email,
            'phone' => $request->phone ?? $member->phone,
            'updated_at' => now()
        ]);

        return response()->json([
            'status' => true,
            'message' => '更新成功'
        ]);
    }

    /**
     * 修改密碼
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
} 