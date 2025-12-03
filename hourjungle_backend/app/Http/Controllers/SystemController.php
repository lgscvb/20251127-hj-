<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\ApiHelperTrait;
use App\Models\Config;
use App\Models\LineBot;
use App\Models\SystemLog;
use Illuminate\Http\Request;

/**
 * 系統管理 Controller
 *
 * 處理系統設定、Line Bot 設定、系統日誌
 */
class SystemController extends Controller
{
    use ApiHelperTrait;

    // ==================== 系統設定 ====================

    /**
     * 獲取系統設定
     */
    public function getConfig()
    {
        try {
            $config = Config::first();

            if (!$config) {
                // 如果沒有設定，建立預設設定
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

            return $this->successResponse('獲取成功', $config);
        } catch (\Exception $e) {
            return $this->errorResponse('獲取失敗：' . $e->getMessage());
        }
    }

    /**
     * 更新系統設定
     */
    public function updateConfig(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $config = Config::first();

            if (!$config) {
                $config = new Config();
            }

            // 驗證輸入
            if (isset($request->overdue_days) && $request->overdue_days < 0) {
                return $this->errorResponse('逾期天數不能小於0');
            }

            if (isset($request->penalty_fee) && $request->penalty_fee < 0) {
                return $this->errorResponse('違約金不能小於0');
            }

            if (isset($request->late_fee) && $request->late_fee < 0) {
                return $this->errorResponse('滯納金(%)不能小於0');
            }

            // 更新設定
            $config->fill($request->all());
            $config->save();

            $systemlog_description = '[修改系統設定] 逾期天數:'.$request->overdue_days.' 滯納金(%):'.$request->late_fee.' 違約金:'.$request->penalty_fee;
            $this->createSystemLog($member->id, '修改', $systemlog_description, 'configs', $config->id, 'update');

            return $this->successResponse('更新成功');
        } catch (\Exception $e) {
            return $this->errorResponse('更新失敗：' . $e->getMessage());
        }
    }

    // ==================== Line Bot 設定 ====================

    /**
     * 獲取 Line Bot 設定列表
     */
    public function getLineBotList(Request $request)
    {
        try {
            $lineBots = LineBot::with('branch')->get();

            // 轉換資料格式
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

            return $this->successResponse('獲取成功', $lineBots);
        } catch (\Exception $e) {
            return $this->errorResponse('獲取失敗：' . $e->getMessage());
        }
    }

    /**
     * 更新 Line Bot 設定
     */
    public function updateLineBot(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $lineBot = LineBot::find($request->id);
            if (!$lineBot) {
                return $this->errorResponse('Line Bot 設定不存在');
            }

            $lineBot->update($request->all());

            $systemlog_description = '[修改Line Bot設定] 分館:'.$lineBot->branch->name.' 頻道密鑰:'.$lineBot->channel_secret.' 頻道Token:'.$lineBot->channel_token.' 頻道Liff ID:'.$lineBot->liff_id.' 付款通知:'.$lineBot->payment_notice.' 續約通知:'.$lineBot->renewql_notice;
            $this->createSystemLog($member->id, '修改', $systemlog_description, 'line_bots', $lineBot->id, 'update');

            return $this->successResponse('更新成功');
        } catch (\Exception $e) {
            return $this->errorResponse('更新失敗：' . $e->getMessage());
        }
    }

    // ==================== 系統日誌 ====================

    /**
     * 獲取系統日誌列表
     */
    public function getSystemLog(Request $request)
    {
        try {
            $start_day = $request->start_day;
            $end_day = $request->end_day;
            $sql_table = $request->sql_table;
            $sql_action = $request->sql_action;
            $branch_id = $request->branch_id;
            $search_member_account = $request->account;
            $keyword = $request->keyword;

            switch ($sql_table) {
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

            switch ($sql_action) {
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

            if (!empty($start_day)) {
                $systemLog->whereDate('system_logs.created_at', '>=', $start_day);
            }

            if (!empty($end_day)) {
                $systemLog->whereDate('system_logs.created_at', '<=', $end_day);
            }

            if (!empty($sql_table)) {
                $systemLog->where('system_logs.sql_table', $sql_table);
            }

            if (!empty($sql_action)) {
                $systemLog->where('system_logs.sql_action', $sql_action);
            }

            if (!empty($branch_id)) {
                $systemLog->where('members.branch_id', $branch_id);
            }

            if (!empty($search_member_account)) {
                $systemLog->where('members.account', $search_member_account);
            }

            if (!empty($keyword)) {
                $systemLog->where('system_logs.description', 'like', '%'.$keyword.'%');
            }

            $systemLog = $systemLog->get();

            return response()->json([
                'status' => true,
                'data' => $systemLog
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('獲取失敗：' . $e->getMessage());
        }
    }
}
