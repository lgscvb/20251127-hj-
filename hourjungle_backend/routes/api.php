<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BusinessItemController;
use App\Http\Controllers\SystemController;
use App\Http\Controllers\LineBotController;
use App\Http\Controllers\BillController;

// ===== 權限/角色管理（已重構到 MemberController） =====
Route::get('/permissions', [MemberController::class, 'getPermissions']);
Route::get('/roles', [MemberController::class, 'getRoles']);
Route::post('/create-permission', [MemberController::class, 'createPermission']);
Route::post('/create-role', [MemberController::class, 'createRole']);
Route::post('/delete-permission', [MemberController::class, 'deletePermission']);
Route::post('/delete-role', [MemberController::class, 'deleteRole']);
Route::post('/modify-role', [MemberController::class, 'modifyRole']);
Route::post('/create-or-update-role-permission', [MemberController::class, 'createOrUpdateRolePermission']);

// ===== 會員管理（已重構到 MemberController） =====
Route::post('/create-member', [MemberController::class, 'createMember']);
Route::get('/create-member-info', [MemberController::class, 'createMemberInfo']);
Route::post('/update-member', [MemberController::class, 'updateMember']);
Route::post('/delete-member', [MemberController::class, 'deleteMember']);
Route::post('/get-memberinfo', [MemberController::class, 'getMemberInfo']);
Route::post('/update-member-password', [MemberController::class, 'updateMemberPassword']);
Route::post('/reset-member-password', [MemberController::class, 'resetMemberPassword']);
Route::get('/get-all-members', [MemberController::class, 'getAllMembers']);
Route::post('/login', [MemberController::class, 'login']);
Route::post('/logout', [MemberController::class, 'logout']);

// ===== 前端會員認證（MemberController） =====
Route::post('/member/register', [MemberController::class, 'register']);
Route::post('/member/update-password', [MemberController::class, 'updatePassword']);
Route::post('/member/forgot-password', [MemberController::class, 'forgotPassword']);
Route::post('/member/reset-password', [MemberController::class, 'resetPassword']);

// ===== 分館管理（已重構到 BranchController） =====
Route::get('/get-branch-list', [BranchController::class, 'getBranchList']);
Route::post('/get-branch-info', [BranchController::class, 'getBranchInfo']);
Route::post('/create-branch', [BranchController::class, 'createBranch']);
Route::post('/update-branch', [BranchController::class, 'updateBranch']);
Route::post('/delete-branch', [BranchController::class, 'deleteBranch']);

// ===== 客戶管理（已重構到 CustomerController） =====
Route::get('/get-customers-list', [CustomerController::class, 'getCustomersList']);
Route::post('/create-customer', [CustomerController::class, 'createCustomer']);
Route::post('/update-customer', [CustomerController::class, 'updateCustomer']);
Route::post('/delete-customer', [CustomerController::class, 'deleteCustomer']);
Route::post('/get-customer-info', [CustomerController::class, 'getCustomerInfo']);
Route::get('/export-customers-example', [CustomerController::class, 'exportCustomersExample']);
Route::get('/export-customers', [CustomerController::class, 'exportCustomers']);
Route::post('/import-customers', [CustomerController::class, 'importCustomers']);

// ===== 業務項目管理（已重構到 BusinessItemController） =====
Route::post('/create-business-item', [BusinessItemController::class, 'createBusinessItem']);
Route::post('/update-business-item', [BusinessItemController::class, 'updateBusinessItem']);
Route::post('/delete-business-item', [BusinessItemController::class, 'deleteBusinessItem']);
Route::post('/get-business-item-info', [BusinessItemController::class, 'getBusinessItemInfo']);
Route::get('/get-business-item-list', [BusinessItemController::class, 'getBusinessItemList']);
Route::get('/export-business-items-example', [BusinessItemController::class, 'exportBusinessItemsExample']);
Route::get('/export-business-items', [BusinessItemController::class, 'exportBusinessItems']);
Route::post('/import-business-items', [BusinessItemController::class, 'importBusinessItems']);

// ===== 合約管理（已重構到 ProjectController） =====
Route::post('/create-project', [ProjectController::class, 'createProject']);
Route::post('/update-project', [ProjectController::class, 'updateProject']);
Route::post('/delete-project', [ProjectController::class, 'deleteProject']);
Route::get('/get-project-list', [ProjectController::class, 'getProjectList']);
Route::post('/get-project-info', [ProjectController::class, 'getProjectInfo']);
Route::get('/public/project/{id}', [ProjectController::class, 'getPublicProjectInfo']);
Route::get('/contract-pdf/{projectId}', [ProjectController::class, 'getContractPdf']);
Route::get('/export-projects-example', [ProjectController::class, 'exportProjectsExample']);
Route::get('/export-projects', [ProjectController::class, 'exportProjects']);
Route::post('/import-projects', [ProjectController::class, 'importProjects']);

// ===== 繳費歷程（已重構到 ProjectController） =====
Route::post('/create-payment-history', [ProjectController::class, 'createPaymentHistory']);
Route::get('/get-payment-history-list', [ProjectController::class, 'getPaymentHistoryList']);

// ===== 合約確認/上傳（已重構到 ProjectController） =====
Route::post('/confirm-contract', [ProjectController::class, 'confirmContract']);
Route::post('/upload-contract-pdf', [ProjectController::class, 'uploadContractPdf']);
Route::get('/download-contract/{projectId}', [ProjectController::class, 'downloadContract']);

// ===== 系統設定（已重構到 SystemController） =====
Route::get('/get-config', [SystemController::class, 'getConfig']);
Route::post('/update-config', [SystemController::class, 'updateConfig']);
Route::get('/get-line-bot-list', [SystemController::class, 'getLineBotList']);
Route::post('/update-line-bot', [SystemController::class, 'updateLineBot']);
Route::get('/get-system-log', [SystemController::class, 'getSystemLog']);

// ===== 其他功能（暫時保留在 ApiController） =====
Route::post('/send-line-message', [ApiController::class, 'sendLineMessage']);
Route::get('/dashboard', [ApiController::class, 'dashboard']);

// ===== LINE Bot Webhook =====
Route::post('/webhook/{botId?}', [LineBotController::class, 'webhook'])->name('line.webhook');
Route::post('/send-message', [LineBotController::class, 'sendMessage']);
Route::post('/broadcast', [LineBotController::class, 'broadcast']);
Route::post('/create-customer-user', [LineBotController::class, 'createCustomerUser']);
Route::post('/get-customer-user', [LineBotController::class, 'getCustomerUser']);

// ===== 發票管理 =====
Route::prefix('bills')->group(function () {
    Route::get('/', [BillController::class, 'index']);
    Route::get('/{id}', [BillController::class, 'show']);
    Route::post('/', [BillController::class, 'store']);
    Route::put('/{id}', [BillController::class, 'update']);
    Route::delete('/{id}', [BillController::class, 'destroy']);
});

// ===== 資料品質檢查 =====
use App\Http\Controllers\DataQualityController;

Route::get('/data-quality/warnings', [DataQualityController::class, 'getWarnings']);
Route::get('/data-quality/summary', [DataQualityController::class, 'getSummary']);

// ===== Brain AI 系統整合 =====
use App\Http\Controllers\BrainIntegrationController;

Route::prefix('brain')->middleware(\App\Http\Middleware\BrainApiKeyMiddleware::class)->group(function () {
    // 查詢客戶資料（by LINE userId）
    Route::get('/customer/{lineUserId}', [BrainIntegrationController::class, 'getCustomerByLineId']);

    // 查詢客戶合約
    Route::get('/customer/{lineUserId}/contracts', [BrainIntegrationController::class, 'getCustomerContracts']);

    // 查詢客戶繳費記錄
    Route::get('/customer/{lineUserId}/payments', [BrainIntegrationController::class, 'getCustomerPayments']);

    // 建立潛在客戶（Brain 轉交）
    Route::post('/leads', [BrainIntegrationController::class, 'createLead']);

    // 記錄互動
    Route::post('/interactions', [BrainIntegrationController::class, 'recordInteraction']);
});

// ===== 自動化任務管理 =====
use App\Http\Controllers\AutomationController;

Route::prefix('automation')->group(function () {
    // 任務列表
    Route::get('/tasks', [AutomationController::class, 'index']);
    // 單一任務
    Route::get('/tasks/{id}', [AutomationController::class, 'show']);
    // 手動建立任務
    Route::post('/tasks', [AutomationController::class, 'store']);
    // 取消任務
    Route::post('/tasks/{id}/cancel', [AutomationController::class, 'cancel']);
    // 掃描並建立提醒任務
    Route::post('/scan', [AutomationController::class, 'scanAndCreateTasks']);
    // 統計資訊
    Route::get('/stats', [AutomationController::class, 'stats']);
});
