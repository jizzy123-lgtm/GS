<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
foreach(App\Models\Role::all() as $r) {
    echo "ID: {$r->id}, Name: {$r->role_name}\n";
}
