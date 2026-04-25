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
            'password' => Hash::make('password123'), // Change to a secure password in production
            'role_id' => 1,  // Assuming 1 = Admin
            'position_id' => 2, // Optional: adjust based on your positions table
            'office_id' => 1,   // Optional: adjust based on your offices table
            'status_id' => 2,   // Assuming 1 = Pending/Approved etc.d
        ]);
    }
}
