<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
foreach(App\Models\User::whereIn('id', [8, 9])->get() as $u) {
    echo "ID: {$u->id}, Name: {$u->last_name}, Role: {$u->role_id}\n";
}
