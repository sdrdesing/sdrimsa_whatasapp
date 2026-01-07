<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Desabilitar el check de information_schema que causa timeouts en MariaDB
        \Illuminate\Database\Schema\Blueprint::defaultStringLength(191);
        
        // Fix para evitar queries lentas a information_schema en MariaDB
        if (app()->runningInConsole()) {
            DB::statement('SET SESSION sql_mode="STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION"');
        }
    }
}
