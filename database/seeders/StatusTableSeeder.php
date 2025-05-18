<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Status;

class StatusTableSeeder extends Seeder
{
    public function run()
    {
        Status::insert([
            ['name' => 'Pending'],
            ['name' => 'Approved'],
            ['name' => 'Disapproved'],
            ['name' => 'Done'],
            ['name' => 'Canceled'],
            ['name' => 'Urgent'],
            ['name' => 'Onhold'],
        ]);
    }
}

