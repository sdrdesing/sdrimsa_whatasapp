<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

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
            $validated = $request->validate([
                'id' => 'required|string|alpha_dash|max:63|unique:tenants,id',
            ]);

            Log::info('Iniciando creación de tenant: ' . $request->id);

            // Crear el tenant — TenancyServiceProvider se encarga automáticamente de:
            // 1. CreateDatabase (crea la BD del tenant)
            // 2. MigrateDatabase (ejecuta migraciones del tenant)
            // 3. SeedTenantDatabase (ejecuta el seeder del tenant)
            $tenant = Tenant::create([
                'id' => $request->id,
            ]);

            Log::info('Tenant creado: ' . $tenant->id);

            // Crear el dominio
            $dominBase = parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';

            $domain = $tenant->domains()->create([
                'domain' => $request->id . '.' . $dominBase,
            ]);

            Log::info('Dominio creado: ' . $domain->domain);

            return redirect()->route('tenants.index')->with('success', "Tenant '{$request->id}' creado exitosamente");
        } catch (\Exception $e) {
            Log::error('Error al crear tenant: ' . $e->getMessage());
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
            'id' => 'required|string|alpha_dash|max:63|unique:tenants,id,' . $tenant->id,
        ]);

        $dominBase = parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';

        $tenant->update([
            'id' => $request->id,
        ]);
        $tenant->domains()->update([
            'domain' => $request->id . '.' . $dominBase,
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

    public function updatePassword(Request $request, Tenant $tenant)
    {
        $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ]);

        try {
            $tenant->run(function () use ($request) {
                $user = \App\Models\User::first();
                if ($user) {
                    $user->update([
                        'password' => bcrypt($request->password),
                    ]);
                } else {
                    throw new \Exception("No se encontró usuario administrador en el tenant.");
                }
            });

            return redirect()->route('tenants.index')->with('success', 'Contraseña actualizada correctamente para el tenant ' . $tenant->id);
        } catch (\Exception $e) {
            Log::error('Error al actualizar contraseña del tenant: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Error al cambiar contraseña: ' . $e->getMessage()]);
        }
    }
}
