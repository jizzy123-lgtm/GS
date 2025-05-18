<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Role;

class RolesTableSeeder extends Seeder
{
    public function run()
    {
        Role::insert([
            ['role_name' => 'Admin'],
            ['role_name' => 'Head'],
            ['role_name' => 'Staff'],
            ['role_name' => 'Requester'],
            ['role_name' => 'Campus_Director'],
        ]);
    }
}

