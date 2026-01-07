<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
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
            Log::info('1. Iniciando creación de tenant: ' . $request->id);
            
            $validated = $request->validate([
                'id' => 'required|unique:tenants,id',
            ]);
            
            Log::info('2. Validación pasada para: ' . $request->id);
            
            // Crear el tenant
            $tenant = Tenant::create([
                'id' => $request->id,
            ]);
            
            Log::info('3. Tenant creado: ' . $tenant->id);
            
            // Crear el dominio
            $dominBase = parse_url(env('APP_URL'), PHP_URL_HOST) ?: 'localhost';
            Log::info('4. Dominio base: ' . $dominBase);
            
            $domain = $tenant->domains()->create([
                'domain' => $request->id . '.' . $dominBase,
            ]);
            
            Log::info('5. Dominio creado: ' . $domain->domain);

            // Crear la base de datos del tenant MANUALMENTE
            Log::info('6. Creando base de datos para tenant: ' . $tenant->id);
            try {
                $databaseName = $tenant->database()->getName();
                Log::info('Nombre de base de datos: ' . $databaseName);
                
                // Conectar directamente con root usando PDO para crear la BD
                $host = env('DB_HOST', 'mysql');
                $pdo = new \PDO(
                    "mysql:host={$host}",
                    'root',
                    'root',
                    [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
                );
                
                // Verificar si la base de datos ya existe
                $checkSql = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '{$databaseName}'";
                $stmt = $pdo->query($checkSql);
                $result = $stmt->fetch();
                
                if (!$result) {
                    // Crear base de datos solo si no existe
                    $sql = "CREATE DATABASE `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;";
                    $pdo->exec($sql);
                    Log::info('Base de datos creada: ' . $databaseName);
                } else {
                    Log::info('Base de datos ya existe: ' . $databaseName);
                }
                
                // Otorgar permisos al usuario sdrimsac
                $grantSql = "GRANT ALL PRIVILEGES ON `{$databaseName}`.* TO 'sdrimsac'@'%';";
                $pdo->exec($grantSql);
                
                // Flush privileges
                $pdo->exec("FLUSH PRIVILEGES;");
                
                Log::info('7. Base de datos lista: ' . $databaseName);
            } catch (\Exception $dbError) {
                Log::error('Error al crear base de datos: ' . $dbError->getMessage());
                throw $dbError;
            }

            // Ejecutar migraciones para el tenant
            Log::info('8. Ejecutando migraciones para tenant: ' . $tenant->id);
            Artisan::call('tenants:migrate', [
                '--quiet' => true,
            ]);
            Log::info('9. Migraciones completadas para tenant: ' . $tenant->id);

            // Crear usuario por defecto en el tenant
            Log::info('10. Creando usuario por defecto para tenant: ' . $tenant->id);
            try {
                $tenant->run(function () use ($tenant) {
                    Log::info('Dentro de tenant->run() para tenant: ' . $tenant->id);
                    try {
                        // Crear el usuario directamente
                        $user = \App\Models\User::create([
                            'name' => 'admin',
                            'email' => 'admin@gmail.com',
                            'password' => bcrypt('123456'),
                            'email_verified_at' => now(),
                        ]);
                        Log::info('Usuario admin CREADO para tenant: ' . $tenant->id . ' - User ID: ' . $user->id . ' - Email: ' . $user->email);
                    } catch (\Illuminate\Database\QueryException $queryError) {
                        // Si el usuario ya existe (constraint duplicate), solo log
                        if (strpos($queryError->getMessage(), 'Duplicate entry') !== false) {
                            Log::info('Usuario admin YA EXISTE para tenant: ' . $tenant->id);
                        } else {
                            Log::error('Error DB creando usuario en tenant ' . $tenant->id . ': ' . $queryError->getMessage());
                            throw $queryError;
                        }
                    } catch (\Exception $userError) {
                        Log::error('Error creando usuario en tenant ' . $tenant->id . ': ' . $userError->getMessage() . ' - Trace: ' . $userError->getTraceAsString());
                        throw $userError;
                    }
                });
                Log::info('11. Usuario por defecto completado para tenant: ' . $tenant->id);
            } catch (\Exception $tenantRunError) {
                Log::error('Error al ejecutar tenant->run() para crear usuario: ' . $tenantRunError->getMessage() . ' - Trace: ' . $tenantRunError->getTraceAsString());
                throw $tenantRunError;
            }

            return redirect()->route('tenants.index')->with('success', "Tenant '{$request->id}' creado exitosamente");
        } catch (\Exception $e) {
            Log::error('ERROR: ' . $e->getMessage());
            Log::error('TRACE: ' . $e->getTraceAsString());
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
