<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User; // Import User model
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'last_name' => 'Admin',
            'first_name' => 'System',
            'middle_name' => 'A',
            'suffix' => null,
            'username' => 'admin123',
            'email' => 'admin@example.com',
            'contact_number' => '09123456789',
            'password' => Hash::make('password123'),
            'role_id' => 1,  // Admin
            'position_id' => 1,
            'office_id' => 1,
            'status_id' => 2,
        ]);

        User::create([
            'last_name' => 'Head',
            'first_name' => 'GSO',
            'middle_name' => 'H',
            'suffix' => null,
            'username' => 'head123',
            'email' => 'head@example.com',
            'contact_number' => '09987654321',
            'password' => Hash::make('password123'),
            'role_id' => 2,  // Head
            'position_id' => 1,
            'office_id' => 1,
            'status_id' => 2,
        ]);
    }
}
