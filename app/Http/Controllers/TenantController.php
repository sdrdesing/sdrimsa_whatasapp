<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Stancl\Tenancy\Database\Models\Domain;
use Illuminate\Support\Facades\Artisan;

class TenantController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function index()
    {
        $tenants = Tenant::with('domains')->get()->map(function ($t) {
            return [
                'id' => $t->id,
                'name' => data_get($t, 'data.name') ?? null,
                'domains' => $t->domains->map(function ($d) {
                    return [
                        'id' => $d->id ?? null,
                        'domain' => $d->domain ?? null,
                    ];
                })->values(),
                'domain' => optional($t->domains->first())->domain,
            ];
        });

        return Inertia::render('tenants/index', [
            'tenants' => $tenants,
        ]);
    }

    public function create()
    {
        return Inertia::render('tenants/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|unique:tenants,id',
            ]);
            
            $tenant = Tenant::create([
                'id' => $request->id,
            ]);
            
            $dominBase = parse_url(env('APP_URL'), PHP_URL_HOST) ?: 'localhost';
            $tenant->domains()->create([
                'domain' => $request->id . '.' . $dominBase,
            ]);

            // Ejecutar migraciones primero
            $tenant->run(function () {
                Artisan::call('migrate', [
                    '--force' => true,
                ]);
            });

            // Luego ejecutar seeders
            $tenant->run(function () {
                Artisan::call('db:seed', [
                    '--class' => \Database\Seeders\TenantSeeder::class,
                ]);
            });

            return redirect()->route('tenants.index')->with('success', "Tenant '{$request->id}' creado exitosamente");
        } catch (\Exception $e) {
            Log::error('Error creando tenant: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Error al crear el tenant: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Tenant $tenant)
    {
        return Inertia::render('tenants/Show', [
            'tenant' => $tenant,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Tenant $tenant)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tenant $tenant)
    {
        $request->validate([
            'id' => 'required|unique:tenants,id,' . $tenant->id,
        ]);
        $tenant->update([
            'id' => $request->id,
        ]);
        $tenant->domains()->update([
            'domain' => $request->id . '.' . 'sdrimsacbot.test',
        ]);
        return redirect()->route('tenants.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tenant $tenant)
    {
        $tenant->delete();
        return redirect()->route('tenants.index');
    }
}
