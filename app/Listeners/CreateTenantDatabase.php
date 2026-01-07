<?php

namespace App\Listeners;

use Stancl\Tenancy\Events\TenantCreated;
use Illuminate\Support\Facades\Artisan;

class CreateTenantDatabase
{
    /**
     * Handle the event.
     */
    public function handle(TenantCreated $event): void
    {
        // Ejecutar migraciones para el tenant
        Artisan::call('tenants:migrate', [
            '--quiet' => true,
        ]);

        // Ejecutar seeders para el tenant (opcional)
        Artisan::call('tenants:seed', [
            '--quiet' => true,
        ]);
    }
}
