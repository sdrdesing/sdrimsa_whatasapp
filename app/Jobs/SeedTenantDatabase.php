<?php

namespace App\Jobs;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SeedTenantDatabase implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Tenant $tenant;

    public function __construct(Tenant $tenant)
    {
        $this->tenant = $tenant;
    }

    public function handle(): void
    {
        // Asegurar que el tenant existe
        $tenant = Tenant::query()->find($this->tenant->id);
        
        if (!$tenant) {
            Log::error("Tenant not found: {$this->tenant->id}");
            throw new \Exception("Tenant not found: {$this->tenant->id}");
        }

        Log::info("Seeding database for tenant: {$tenant->id}");

        try {
            $tenant->run(function () {
                $output = Artisan::call('db:seed', [
                    '--class' => \Database\Seeders\TenantSeeder::class,
                    '--force' => true,
                ]);
                Log::info("Seeder executed with output: " . $output);
            });
            Log::info("Successfully seeded tenant: {$tenant->id}");
        } catch (\Exception $e) {
            Log::error("Error seeding tenant {$tenant->id}: " . $e->getMessage());
            throw $e;
        }
    }
}
