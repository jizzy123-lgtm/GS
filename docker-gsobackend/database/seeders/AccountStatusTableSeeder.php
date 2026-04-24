<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AccountStatusTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        DB::table('account_statuses')->insert([
            ['name' => 'Pending'],      // 1
            ['name' => 'Approved'],     // 2
            ['name' => 'Disapproved'],  // 3
        ]);
    }
}
