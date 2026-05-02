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
// ✅ Public Routes (No Auth Required)
// ============================================================
Route::post('/register', [UserController::class, 'register']);
Route::post('/login',    [UserController::class, 'login']);

// ============================================================
// ✅ Protected Routes (auth:sanctum required)
// ============================================================
Route::middleware('auth:sanctum')->group(function () {

    // ----------------------------------------------------------
    // Auth
    // ----------------------------------------------------------
    Route::post('/logout', [UserController::class, 'logout']);

    // ----------------------------------------------------------
    // Maintenance Requests — specific routes FIRST
    // (must come before apiResource to avoid route swallowing)
    // ----------------------------------------------------------
    Route::get('/maintenance-requests/approved-by-head',     [MaintenanceRequestController::class, 'approvedByHeadRequests']);
    Route::get('/maintenance-requests/approved-by-director', [MaintenanceRequestController::class, 'approvedByDirectorRequests']);
    Route::get('/maintenance-requests/by-status',            [MaintenanceRequestController::class, 'getRequestsByStatus']);
    Route::get('/maintenance-requests/list-with-details',    [MaintenanceRequestController::class, 'indexWithDetails']);
    Route::get('/maintenance-requests/priority-numbers',     [MaintenanceRequestController::class, 'getUsedPriorityNumbers']);
    Route::get('/maintenance-requests/{id}/request-date',    [MaintenanceRequestController::class, 'getRequestDate']);

    // ----------------------------------------------------------
    // Maintenance Requests — apiResource (AFTER specific routes)
    // ----------------------------------------------------------
    Route::apiResource('/maintenance-requests', MaintenanceRequestController::class);

    // ----------------------------------------------------------
    // Maintenance Request Actions
    // ----------------------------------------------------------
    Route::put('/maintenance-requests/{id}/verify',           [MaintenanceRequestController::class, 'verify']);
    Route::put('/maintenance-requests/{id}/approve-head',     [MaintenanceRequestController::class, 'approveByHead']);
    Route::put('/maintenance-requests/{id}/approve-director', [MaintenanceRequestController::class, 'approveByDirector']);
    Route::put('/maintenance-requests/{id}/disapprove',       [MaintenanceRequestController::class, 'disapprove']);
    Route::put('/maintenance-requests/{id}/deny',             [MaintenanceRequestController::class, 'denyRequest']);
    Route::put('/maintenance-requests/{id}/view',             [MaintenanceRequestController::class, 'autosaveDateTime']);
    Route::put('/maintenance-requests/{id}/mark-done',        [MaintenanceRequestController::class, 'markAsDone']);
    Route::put('/maintenance-requests/{id}/assign-priority',  [MaintenanceRequestController::class, 'assignPriority']);
    Route::put('/maintenance-requests/{id}/editDetails',      [MaintenanceRequestController::class, 'updateDetails']);
    Route::put('/maintenance-requests/{id}/cancel',           [MaintenanceRequestController::class, 'cancelRequest']);
    
    // ----------------------------------------------------------
    // POV Routes
    // ----------------------------------------------------------
    Route::get('/staffpov/{id}',    [MaintenanceRequestController::class, 'staffpov']);
    Route::get('/headpov/{id}',     [MaintenanceRequestController::class, 'headpov']);
    Route::get('/directorpov/{id}', [MaintenanceRequestController::class, 'directorpov']);

    // ----------------------------------------------------------
    // Schedules & Calendar
    // ----------------------------------------------------------
    Route::get('/schedules', [MaintenanceRequestController::class, 'getSchedules']);

    // ----------------------------------------------------------
    // Priority Number
    // ----------------------------------------------------------
    Route::get('/generate-priority-number/{maintenanceTypeId}', [MaintenanceRequestController::class, 'generatePriorityNumber']);
    Route::get('/forPriority',                                  [MaintenanceRequestController::class, 'forPriorityNumber']);

    // ----------------------------------------------------------
    // Users
    // ----------------------------------------------------------
    Route::get('/users/idfullname',    [UserController::class, 'getAuthenticatedUserInfo']);
    Route::get('/users/reqInfo',       [UserController::class, 'getUserDetails']);
    Route::get('/users/userWithRole',  [UserController::class, 'getUserDetailRole']);
    Route::get('/users/{id}/fullname', [UserController::class, 'getFullName']);
    Route::get('/users-list',          [UserController::class, 'usersList']);
    Route::delete('/users/{id}',       [UserController::class, 'destroy']);

    Route::put('/users/{id}/updateAccountStatus',     [UserController::class, 'updateAccountStatus']);
    Route::put('/users/{id}/dissaproveAccountStatus', [UserController::class, 'rejectAccountStatus']);
    Route::get('/pending-approvals',                  [UserController::class, 'getPendingApprovals']);
    Route::get('/uspass',                             [UserController::class, 'getUsPass']);

    // ----------------------------------------------------------
    // Profile
    // ----------------------------------------------------------
    Route::post('/profile/update',           [UserController::class, 'updateProfile']);
    Route::post('/profile/upload-picture',   [UserController::class, 'uploadProfilePicture']);
    Route::get('/profile/picture',           [UserController::class, 'getProfilePicture']);
    Route::get('/profile/userInfos',         [UserController::class, 'userDetails']);
    Route::delete('/profile/remove-picture', [UserController::class, 'removeProfilePicture']);

    // ----------------------------------------------------------
    // Feedback
    // ----------------------------------------------------------
    Route::post('/feedback',                                      [FeedbackController::class, 'store']);
    Route::get('/feedbacks/{id}/details',                         [FeedbackController::class, 'showFeedbackDetails']);
    Route::get('/feedbacks/request/{maintenance_request_id}',     [FeedbackController::class, 'getByRequest']);
    Route::get('/feedbacks/{id}',                                 [FeedbackController::class, 'show']);
    Route::get('/feedbacks',                                      [FeedbackController::class, 'index']);

    // ----------------------------------------------------------
    // Notifications
    // ----------------------------------------------------------
    Route::get('/notifications',                 [NotificationController::class, 'index']);
    Route::get('/notifications/unreadCount',     [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/markAsRead/{id}', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/markAllAsRead',   [NotificationController::class, 'markAllAsRead']);

    // ----------------------------------------------------------
    // Comments
    // ----------------------------------------------------------
    Route::get('/comments',                          [CommentController::class, 'index']);
    Route::post('/comment',                          [CommentController::class, 'store']);
    Route::get('/comments/{id}',                     [CommentController::class, 'show']);
    Route::put('/comments/{id}',                     [CommentController::class, 'update']);
    Route::delete('/comments/{id}',                  [CommentController::class, 'destroy']);
    Route::get('/requests/{id}/comments-by-request', [CommentController::class, 'commentsByRequest']);

    // ----------------------------------------------------------
    // Resources
    // ----------------------------------------------------------
    Route::apiResource('roles',             RoleController::class);
    Route::apiResource('positions',         PositionController::class);
    Route::apiResource('offices',           OfficeController::class);
    Route::apiResource('statuses',          StatusController::class);
    Route::apiResource('maintenance-types', MaintenanceTypeController::class);

    Route::post('/addservice',       [MaintenanceTypeController::class, 'store']);
    Route::get('/maintenance-types', [MaintenanceTypeController::class, 'index']);

    // ----------------------------------------------------------
    // Misc / Common Data
    // ----------------------------------------------------------
    Route::get('/common-datas',        [UserController::class, 'commonDatas']);
    Route::get('/accountStatuses',     [StatusController::class, 'accountStatuses']);
    Route::get('/statusesPovDirector', [StatusController::class, 'statusesPovDirector']);
    Route::get('/statusesPovHead',     [StatusController::class, 'statusesPovHead']);

});