<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MaintenanceTypeSeeder extends Seeder
{
    public function run()
    {
        DB::table('maintenance_types')->insert([
            ['type_name' => 'Janitorial'],
            ['type_name' => 'Carpentry'],
            ['type_name' => 'Electrical'],
            ['type_name' => 'Airconditioning'],
        ]);
    }
}

