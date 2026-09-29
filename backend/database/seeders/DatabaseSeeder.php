<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! User::where('email', 'admin@test.com')->exists()) {
            User::forceCreate([
                'name' => 'Admin',
                'email' => 'admin@test.com',
                'password' => bcrypt('password'),
                'role' => 'admin',
            ]);
        }

        $this->call(ProduitsReelsSeeder::class);
    }
}