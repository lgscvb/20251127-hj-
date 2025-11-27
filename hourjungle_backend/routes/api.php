<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\LineBotController;
use App\Http\Controllers\BillController;

//取得所有的權限項目
Route::get('/permissions', [ApiController::class, 'getPermissions']);
//取得所有的群組名稱
Route::get('/roles', [ApiController::class, 'getRoles']);
//新增權限項目
Route::post('/create-permission', [ApiController::class, 'createPermission']);
//新增群組名稱
Route::post('/create-role', [ApiController::class, 'createRole']);
//刪除權限項目
Route::post('/delete-permission', [ApiController::class, 'deletePermission']);
//刪除群組名稱
Route::post('/delete-role', [ApiController::class, 'deleteRole']);
//修改群組名稱
Route::post('/modify-role', [ApiController::class, 'modifyRole']);
//建立群組與權限的關聯
Route::post('/create-or-update-role-permission', [ApiController::class, 'createOrUpdateRolePermission']);
//建立使用者
Route::post('/create-member', [ApiController::class, 'createMember']);
//建立使用者會用到的資訊
Route::get('/create-member-info', [ApiController::class, 'createMemberInfo']);
//修改使用者
Route::post('/update-member', [ApiController::class, 'updateMember']);
//刪除使用者
Route::post('/delete-member', [ApiController::class, 'deleteMember']);
//取得使用者資訊
Route::post('/get-memberinfo', [ApiController::class, 'getMemberInfo']);
//修改使用者密碼
Route::post('/update-member-password', [ApiController::class, 'updateMemberPassword']);
//重置使用者密碼
Route::post('/reset-member-password', [ApiController::class, 'resetMemberPassword']);
//使用者的場館 列表
Route::get('/get-branch-list', [ApiController::class, 'getBranchList']);
//取得場館資訊
Route::post('/get-branch-info', [ApiController::class, 'getBranchInfo']);
//新增使用者的場館
Route::post('/create-branch', [ApiController::class, 'createBranch']);
//修改使用者的場館
Route::post('/update-branch', [ApiController::class, 'updateBranch']);
//刪除使用者的場館
Route::post('/delete-branch', [ApiController::class, 'deleteBranch']);
//登入
Route::post('/login', [ApiController::class, 'login']);
//登出
Route::post('/logout', [ApiController::class, 'logout']);
//取得所有使用者
Route::get('/get-all-members', [ApiController::class, 'getAllMembers']);
//取得所有客戶列表
Route::get('/get-customers-list', [ApiController::class, 'getCustomersList']);
//新增客戶
Route::post('/create-customer', [ApiController::class, 'createCustomer']);
//修改客戶
Route::post('/update-customer', [ApiController::class, 'updateCustomer']);
//刪除客戶
Route::post('/delete-customer', [ApiController::class, 'deleteCustomer']);
//取得客戶資訊
Route::post('/get-customer-info', [ApiController::class, 'getCustomerInfo']);
//新增業務項目
Route::post('/create-business-item', [ApiController::class, 'createBusinessItem']);
//修改業務項目
Route::post('/update-business-item', [ApiController::class, 'updateBusinessItem']);
//刪除業務項目
Route::post('/delete-business-item', [ApiController::class, 'deleteBusinessItem']);
//取得業務項目資訊
Route::post('/get-business-item-info', [ApiController::class, 'getBusinessItemInfo']);
//取得業務項目列表
Route::get('/get-business-item-list', [ApiController::class, 'getBusinessItemList']);
//取得Line Bot設定列表
Route::get('/get-line-bot-list', [ApiController::class, 'getLineBotList']);
//修改Line Bot設定
Route::post('/update-line-bot', [ApiController::class, 'updateLineBot']);
//取得系統設定
Route::get('/get-config', [ApiController::class, 'getConfig']);
//更新系統設定
Route::post('/update-config', [ApiController::class, 'updateConfig']);
//新增合約
Route::post('/create-project', [ApiController::class, 'createProject']);
//修改合約
Route::post('/update-project', [ApiController::class, 'updateProject']);
//刪除合約
Route::post('/delete-project', [ApiController::class, 'deleteProject']);
//取得合約列表
Route::get('/get-project-list', [ApiController::class, 'getProjectList']);
//取得合約內容
Route::post('/get-project-info', [ApiController::class, 'getProjectInfo']);
//新增繳費歷程
Route::post('/create-payment-history', [ApiController::class, 'createPaymentHistory']);
//列出繳費歷程
Route::get('/get-payment-history-list', [ApiController::class, 'getPaymentHistoryList']);
//確認合約
Route::post('/confirm-contract', [ApiController::class, 'confirmContract']);
//上傳合約 PDF
Route::post('/upload-contract-pdf', [ApiController::class, 'uploadContractPdf']);
//下載合約 PDF
Route::get('/download-contract/{projectId}', [ApiController::class, 'downloadContract']);
//發送 Line 訊息
Route::post('/send-line-message', [ApiController::class, 'sendLineMessage']);
//Dashboard
Route::get('/dashboard', [ApiController::class, 'dashboard']);
//系統異動log
Route::get('/get-system-log', [ApiController::class, 'getSystemLog']);
//匯出客戶資料的範例
Route::get('/export-customers-example', [ApiController::class, 'exportCustomersExample']);
//匯出客戶資料
Route::get('/export-customers', [ApiController::class, 'exportCustomers']);
//匯入客戶資料
Route::post('/import-customers', [ApiController::class, 'importCustomers']);
//匯出業務項目的範例
Route::get('/export-business-items-example', [ApiController::class, 'exportBusinessItemsExample']);
//匯出業務項目
Route::get('/export-business-items', [ApiController::class, 'exportBusinessItems']);
//匯入業務項目
Route::post('/import-business-items', [ApiController::class, 'importBusinessItems']);
//匯出專案的範例
Route::get('/export-projects-example', [ApiController::class, 'exportProjectsExample']);
//匯出專案
Route::get('/export-projects', [ApiController::class, 'exportProjects']);
//匯入專案
Route::post('/import-projects', [ApiController::class, 'importProjects']);


//Line Bot Webhook
// Route::post('/line-bot-webhook', [LineBotController::class, 'webhook']);
Route::post('/webhook/{botId?}', [LineBotController::class, 'webhook'])->name('line.webhook');
Route::post('/send-message', [LineBotController::class, 'sendMessage']);
Route::post('/broadcast', [LineBotController::class, 'broadcast']);
//新增客戶
Route::post('/create-customer-user', [LineBotController::class, 'createCustomerUser']);
//取得客戶資訊
Route::post('/get-customer-user', [LineBotController::class, 'getCustomerUser']);

// 添加公開的合約資料路由
Route::get('/public/project/{id}', [ApiController::class, 'getPublicProjectInfo']);

// 獲取合約PDF
Route::get('/contract-pdf/{projectId}', [ApiController::class, 'getContractPdf']);

// 发票管理API路由
Route::prefix('bills')->group(function () {
    Route::get('/', [BillController::class, 'index']);  // 获取所有发票
    Route::get('/{id}', [BillController::class, 'show']);  // 获取单个发票
    Route::post('/', [BillController::class, 'store']);  // 创建发票
    Route::put('/{id}', [BillController::class, 'update']);  // 更新发票
    Route::delete('/{id}', [BillController::class, 'destroy']);  // 删除发票
});
