<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Office;

class OfficesTableSeeder extends Seeder
{
    public function run()
    {
        Office::insert([
            ['name' => 'General Service Office'],
            ['name' => 'College of Business Administration'],
            ['name' => 'College of Engineering'],
            ['name' => 'College of Criminal Justice'],
            ['name' => 'College of Computer Science'],
            ['name' => 'College of Art and Sciences'],
            ['name' => 'Graduate School'],
            ['name' => 'College of Teacher Education'],
            ['name' => 'College of Nursing and Allied Health'],
        ]);
    }
}

