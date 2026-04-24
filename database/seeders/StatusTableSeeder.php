<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Status;

class StatusTableSeeder extends Seeder
{
    public function run()
    {
        Status::insert([
            ['name' => 'Pending'],               // 1
            ['name' => 'Pending Approval'],              // 2 
            ['name' => 'Verified'],              // 3 
            ['name' => 'Disapproved'],           // 4
            ['name' => 'Done'],                  // 5
            ['name' => 'Canceled'],              // 6
            ['name' => 'Completed'],             // 7
            ['name' => 'Approved by Head'],      // 8
            ['name' => 'Approved by Director'],  // 9
            ['name' => 'Priority Assigned'],     // 10
        ]);
    }
}

