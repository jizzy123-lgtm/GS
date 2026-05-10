<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Status;

class StatusTableSeeder extends Seeder
{
    public function run()
    {
        Status::insert([
            ['name' => 'Pending'],       // ID 1
            ['name' => 'Approved'],       // ID 2
            ['name' => 'Disapproved'],    // ID 3
            ['name' => 'Done'],           // ID 4
            ['name' => 'Canceled'],       // ID 5
            ['name' => 'Urgent'],         // ID 6
            ['name' => 'Onhold'],         // ID 7
            ['name' => 'Completed'],      // ID 8
            ['name' => 'Scheduled'],      // ID 9
        ]);
    }
}

