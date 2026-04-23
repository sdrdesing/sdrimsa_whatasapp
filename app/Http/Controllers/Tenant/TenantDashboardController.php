<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class TenantDashboardController extends Controller
{
    public function login()
    {
        return Inertia::render('tenancy/Auth/Login');
    }

    public function home()
    {
        return Inertia::render('tenancy/Home');
    }

    public function messages()
    {
        return Inertia::render('tenancy/messaje');
    }
}
