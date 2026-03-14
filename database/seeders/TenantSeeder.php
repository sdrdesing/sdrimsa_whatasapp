<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        try {
            
            $user = \App\Models\User::firstOrCreate(
                ['email' => 'admin@gmail.com'],
                [
                    'name' => 'admin',
                    'password' => bcrypt('123456'),
                    'email_verified_at' => now(),
                ]
            );
            
            Log::info("User created/updated: {$user->id} - {$user->email}");
        } catch (\Exception $e) {
            Log::error("Error in TenantSeeder: " . $e->getMessage());
            throw $e;
        }
    }
}
