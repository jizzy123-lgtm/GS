<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RequestController;
use App\Http\Controllers\MaintenanceRequestController;
use App\Http\Controllers\TransportationRequestController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\MaintenanceTypeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\CommentController;
use App\Models\MaintenanceType;

// ============================================================
// ✅ STEP 1: Specific /maintenance-requests/* routes FIRST
//    These MUST come before apiResource or they get swallowed
// ============================================================

Route::middleware('auth:sanctum')->get('/maintenance-requests/approved-by-head',     [MaintenanceRequestController::class, 'approvedByHeadRequests']);
Route::middleware('auth:sanctum')->get('/maintenance-requests/approved-by-director', [MaintenanceRequestController::class, 'approvedByDirectorRequests']);
Route::get('/maintenance-requests/by-status', [MaintenanceRequestController::class, 'getRequestsByStatus']);
Route::get('/maintenance-requests/list-with-details',  [MaintenanceRequestController::class, 'indexWithDetails']);
Route::get('/maintenance-requests/{id}/request-date',  [MaintenanceRequestController::class, 'getRequestDate']);
Route::middleware('auth:sanctum')->get('/maintenance-requests/priority-numbers', [MaintenanceRequestController::class, 'getUsedPriorityNumbers']);

// ============================================================
// ✅ STEP 2: apiResource AFTER the specific routes above
// ============================================================
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('/maintenance-requests', MaintenanceRequestController::class);
});

// ============================================================
// Auth
// ============================================================
Route::post('/register', [UserController::class, 'register']);
Route::post('/login',    [UserController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [UserController::class, 'logout']);

// ============================================================
// Maintenance Request Actions
// ============================================================
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/verify',           [MaintenanceRequestController::class, 'verify']);
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/approve-head',     [MaintenanceRequestController::class, 'approveByHead']);
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/approve-director', [MaintenanceRequestController::class, 'approveByDirector']);
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/disapprove',       [MaintenanceRequestController::class, 'disapprove']);
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/deny',             [MaintenanceRequestController::class, 'denyRequest']);
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/view',             [MaintenanceRequestController::class, 'autosaveDateTime']);
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/mark-done',        [MaintenanceRequestController::class, 'markAsDone']);
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/assign-priority',  [MaintenanceRequestController::class, 'assignPriority']);
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/editDetails',      [MaintenanceRequestController::class, 'updateDetails']);
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/cancel', [MaintenanceRequestController::class, 'cancelRequest']);

Route::middleware('auth:sanctum')->post('/maintenance-requests/{id}/feedback', [MaintenanceRequestController::class, 'submitFeedback']);


// ============================================================
// POV routes
// ============================================================
Route::middleware('auth:sanctum')->get('/staffpov/{id}',    [MaintenanceRequestController::class, 'staffpov']);
Route::middleware('auth:sanctum')->get('/headpov/{id}',     [MaintenanceRequestController::class, 'headpov']);
Route::middleware('auth:sanctum')->get('/directorpov/{id}', [MaintenanceRequestController::class, 'directorpov']);

// ============================================================
// Schedules & Calendar
// ============================================================
Route::middleware('auth:sanctum')->get('/schedules',         [MaintenanceRequestController::class, 'getSchedules']);

// ============================================================
// Priority Number
// ============================================================
Route::get('/generate-priority-number/{maintenanceTypeId}', [MaintenanceRequestController::class, 'generatePriorityNumber']);
Route::get('/forPriority', [MaintenanceRequestController::class, 'forPriorityNumber']);

// ============================================================
// Users
// ============================================================
Route::middleware('auth:sanctum')->get('/users/idfullname',      [UserController::class, 'getAuthenticatedUserInfo']);
Route::middleware('auth:sanctum')->get('/users/reqInfo',         [UserController::class, 'getUserDetails']);
Route::middleware('auth:sanctum')->get('/users/userWithRole',    [UserController::class, 'getUserDetailRole']);
Route::middleware('auth:sanctum')->get('/users/{id}/fullname',   [UserController::class, 'getFullName']);
Route::middleware('auth:sanctum')->get('/users-list', [UserController::class, 'usersList']);
Route::middleware('auth:sanctum')->delete('/users/{id}', [UserController::class, 'destroy']);

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/users/{id}/updateAccountStatus',     [UserController::class, 'updateAccountStatus']);
    Route::put('/users/{id}/dissaproveAccountStatus', [UserController::class, 'rejectAccountStatus']);
    Route::get('/pending-approvals',                  [UserController::class, 'getPendingApprovals']);
    Route::get('/uspass',                             [UserController::class, 'getUsPass']);
});

// ============================================================
// Profile
// ============================================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/profile/update',          [UserController::class, 'updateProfile']);
    Route::post('/profile/upload-picture',  [UserController::class, 'uploadProfilePicture']);
    Route::get('/profile/picture',          [UserController::class, 'getProfilePicture']);
    Route::get('/profile/userInfos',        [UserController::class, 'userDetails']);
    Route::delete('/profile/remove-picture',[UserController::class, 'removeProfilePicture']);
});

// ============================================================
// Feedback
// ============================================================
Route::middleware('auth:sanctum')->post('/feedback',              [FeedbackController::class, 'store']);
Route::middleware('auth:sanctum')->get('/feedbacks/{id}/details', [FeedbackController::class, 'showFeedbackDetails']);
Route::get('/feedbacks/request/{maintenance_request_id}',         [FeedbackController::class, 'getByRequest']);
Route::get('/feedbacks/{id}',                                     [FeedbackController::class, 'show']);
Route::get('/feedbacks',                                          [FeedbackController::class, 'index']);

// ============================================================
// Notifications
// ============================================================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications',                  [NotificationController::class, 'index']);
    Route::get('/notifications/unreadCount',       [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/markAsRead/{id}',   [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/markAllAsRead',     [NotificationController::class, 'markAllAsRead']);
});

// ============================================================
// Comments
// ============================================================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/comments',                           [CommentController::class, 'index']);
    Route::post('/comment',                           [CommentController::class, 'store']);
    Route::get('/comments/{id}',                      [CommentController::class, 'show']);
    Route::put('/comments/{id}',                      [CommentController::class, 'update']);
    Route::delete('/comments/{id}',                   [CommentController::class, 'destroy']);
    Route::get('/requests/{id}/comments-by-request',  [CommentController::class, 'commentsByRequest']);
});

// ============================================================
// Resources & Misc
// ============================================================
Route::apiResource('roles',             RoleController::class);
Route::apiResource('positions',         PositionController::class);
Route::apiResource('offices',           OfficeController::class);
Route::apiResource('statuses',          StatusController::class);
Route::apiResource('maintenance-types', MaintenanceTypeController::class);

Route::middleware('auth:sanctum')->post('/addservice', [MaintenanceTypeController::class, 'store']);
Route::get('/maintenance-types',   [MaintenanceTypeController::class, 'index']);
Route::get('/common-datas',        [UserController::class, 'commonDatas']);
Route::get('/accountStatuses',     [StatusController::class, 'accountStatuses']);
Route::get('/statusesPovDirector', [StatusController::class, 'statusesPovDirector']);
Route::get('/statusesPovHead',     [StatusController::class, 'statusesPovHead']);



