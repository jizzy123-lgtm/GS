<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Position;

class PositionsTableSeeder extends Seeder
{
    public function run()
    {
        Position::insert([
            ['name' => 'Faculty'],
            ['name' => 'Staff'],
        ]);
    }
}

