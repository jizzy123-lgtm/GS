<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MaintenanceRequest;

// Fix requests that are 'Scheduled' but don't have a schedule assigned
// (likely due to the status_id=1 bug)
$affected = MaintenanceRequest::where('status_id', 1)
    ->whereNull('scheduled_date')
    ->update(['status_id' => 2]);

echo "Fixed {$affected} requests from 'Scheduled' to 'Pending'.\n";
