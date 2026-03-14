<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MaintenanceTypeSeeder extends Seeder
{
    public function run()
    {
        DB::table('maintenance_types')->insert([
            ['name' => 'Janitorial'],
            ['name' => 'Carpentry'],
            ['name' => 'Electrical'],
            ['name' => 'Airconditioning'],
        ]);
    }
}

