<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('settings')->insert([
            ['key' => 'institution_name', 'value' => 'INSTITUTE CONTROL CENTER', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'logo_url', 'value' => '', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'domain_url', 'value' => 'localhost:8000', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'grade_threshold_a_plus', 'value' => '90', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'grade_threshold_a', 'value' => '80', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'grade_threshold_b', 'value' => '70', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'grade_threshold_c', 'value' => '60', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
