<?php

namespace Database\Seeders;

use App\Models\MaintenanceType;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();


        $this->call([
            RolesTableSeeder::class,
            StatusTableSeeder::class,
            PositionsTableSeeder::class,
            OfficesTableSeeder::class,
            MaintenanceTypeSeeder::class,
            AdminSeeder::class
        ]);


    }


}
