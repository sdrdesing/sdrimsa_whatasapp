<?php

namespace App\Jobs;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;

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
        $tenant = Tenant::find($this->tenant->id);
        
        if (!$tenant) {
            throw new \Exception("Tenant not found: {$this->tenant->id}");
        }

        $tenant->run(function () {
            Artisan::call('db:seed', [
                '--class' => \Database\Seeders\TenantSeeder::class,
            ]);
        });
    }
}
