<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Status;

if (!Status::where('name', 'Verified')->exists()) {
    Status::create(['id' => 10, 'name' => 'Verified']);
    echo "Added 'Verified' status with ID 10.\n";
} else {
    echo "'Verified' status already exists.\n";
}
