<?php

namespace App\Http\Controllers\Traits;

use App\Models\Member;
use App\Models\SystemLog;
use Illuminate\Support\Facades\Storage;

/**
 * API 共用 Helper Trait
 *
 * 從 ApiController 抽取的共用方法，供各 Controller 使用
 */
trait ApiHelperTrait
{
    /**
     * 檢查登入狀態
     *
     * @return Member|null
     */
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

    /**
     * 建立系統日誌
     *
     * @param int $member_id 操作者 ID
     * @param string $action 操作類型（新增/修改/刪除/匯入/匯出）
     * @param string $description 詳細描述
     * @param string $sql_table 資料表名稱
     * @param int $sql_data_id 資料 ID
     * @param string $sql_action 資料操作類型（create/update/delete/import/export）
     */
    protected function createSystemLog($member_id, $action, $description, $sql_table, $sql_data_id, $sql_action)
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

    /**
     * 處理照片上傳
     *
     * @param \Illuminate\Http\UploadedFile $image 上傳的圖片
     * @param string $savePath 儲存路徑
     * @param int $id 關聯 ID
     * @return string 儲存路徑
     */
    protected function handleImageUpload($image, $savePath, $id)
    {
        try {
            if (!$image->isValid()) {
                throw new \Exception('無效的圖片文件');
            }

            $imageName = time() . $image->getClientOriginalName();
            $path = $savePath . '/' . $id;

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

    /**
     * 匯入的日期格式修正
     *
     * @param mixed $date 日期（Excel 數字或字串）
     * @param string $format 輸出格式
     * @return string|null 格式化後的日期
     */
    protected function formatDate($date, $format = 'Y-m-d')
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

    /**
     * 轉換合約狀態
     *
     * @param int $contractStatus 狀態碼
     * @return string 狀態文字
     */
    protected function transformContractStatus($contractStatus)
    {
        switch ($contractStatus) {
            case 0:
                return '未提交';
            case 1:
                return '審核中';
            case 2:
                return '已審核';
            case 3:
                return '未通過';
            default:
                return '未知';
        }
    }

    /**
     * 返回未登入錯誤回應
     *
     * @return \Illuminate\Http\JsonResponse
     */
    protected function unauthorizedResponse()
    {
        return response()->json([
            'status' => false,
            'message' => '未登入'
        ], 401);
    }

    /**
     * 返回成功回應
     *
     * @param string $message 訊息
     * @param mixed $data 資料
     * @return \Illuminate\Http\JsonResponse
     */
    protected function successResponse($message = '操作成功', $data = null)
    {
        $response = [
            'status' => true,
            'message' => $message
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response);
    }

    /**
     * 返回錯誤回應
     *
     * @param string $message 錯誤訊息
     * @param int $code HTTP 狀態碼
     * @return \Illuminate\Http\JsonResponse
     */
    protected function errorResponse($message = '操作失敗', $code = 400)
    {
        return response()->json([
            'status' => false,
            'message' => $message
        ], $code);
    }
}
