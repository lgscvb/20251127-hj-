<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\ApiHelperTrait;
use App\Models\Config;
use App\Models\LineBot;
use App\Models\SystemLog;
use Illuminate\Http\Request;

/**
 * ûq-š§6h
 *
 * Uûq-šLine Bot -šûqåŒ
 */
class SystemController extends Controller
{
    use ApiHelperTrait;

    // ==================== ûq-š ====================

    /**
     * rÖûq-š
     */
    public function getConfig()
    {
        try {
            $config = Config::first();

            if (!$config) {
                // ‚œ’	MnuúØMn
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

            return $this->successResponse('rÖŸ', $config);
        } catch (\Exception $e) {
            return $this->errorResponse('rÖ1W' . $e->getMessage());
        }
    }

    /**
     * ô°ûq-š
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

            // WIxÚ
            if (isset($request->overdue_days) && $request->overdue_days < 0) {
                return $this->errorResponse('>å)xı¼0');
            }

            if (isset($request->penalty_fee) && $request->penalty_fee < 0) {
                return $this->errorResponse('UÑı¼0');
            }

            if (isset($request->late_fee) && $request->late_fee < 0) {
                return $this->errorResponse('ïÑ(%)ı¼0');
            }

            // ô°Mn
            $config->fill($request->all());
            $config->save();

            $systemlog_description = '[î9ûq-š] >å)x:'.$request->overdue_days.' ïÑ(%):'.$request->late_fee.' UÑ:'.$request->penalty_fee;
            $this->createSystemLog($member->id, 'î9', $systemlog_description, 'configs', $config->id, 'update');

            return $this->successResponse('ô°Ÿ');
        } catch (\Exception $e) {
            return $this->errorResponse('ô°1W' . $e->getMessage());
        }
    }

    // ==================== Line Bot -š ====================

    /**
     * Ö—Line Bot-šh
     */
    public function getLineBotList(Request $request)
    {
        try {
            $lineBots = LineBot::with('branch')->get();

            // î9Ç™IÛè
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

            return $this->successResponse('rÖŸ', $lineBots);
        } catch (\Exception $e) {
            return $this->errorResponse('rÖ1W' . $e->getMessage());
        }
    }

    /**
     * î9Line Bot-š
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
                return $this->errorResponse('Line Bot-šX(');
            }

            $lineBot->update($request->all());

            $systemlog_description = '[î9Line Bot-š] 4(:'.$lineBot->branch->name.' ;SÆp:'.$lineBot->channel_secret.' ;SToken:'.$lineBot->channel_token.' ;SLiff ID:'.$lineBot->liff_id.' Ø>å:'.$lineBot->payment_notice.' Œå:'.$lineBot->renewql_notice;
            $this->createSystemLog($member->id, 'î9', $systemlog_description, 'line_bots', $lineBot->id, 'update');

            return $this->successResponse('î9Ÿ');
        } catch (\Exception $e) {
            return $this->errorResponse('î91W' . $e->getMessage());
        }
    }

    // ==================== ûqåŒ ====================

    /**
     * Ö—ûqpÕlog
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
            return $this->errorResponse('rÖ1W' . $e->getMessage());
        }
    }
}
