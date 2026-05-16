<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Status;

$statuses = Status::all();
foreach ($statuses as $status) {
    echo "ID: {$status->id}, Name: {$status->name}\n";
}
