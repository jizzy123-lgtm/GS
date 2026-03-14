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
            'full_name' => 'Admin User',
            'username' => 'admin',
            'email' => 'admin@example.com',
            'position' => 'Administrator',
            'office' => 'GSO',
            'contact_number' => '09123456789',
            'password' => Hash::make('adminpassword'), // IMPORTANT: use hashing
            'role_id' => 1, // Assuming role_id 1 is Admin
            'account_status' => 'Approved', // Admin is auto-approved
        ]);
    }
}
