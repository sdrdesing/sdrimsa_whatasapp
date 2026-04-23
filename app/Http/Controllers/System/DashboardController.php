<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard');
    }

    public function welcome(): RedirectResponse
    {
        return redirect()->route('system.login');
    }
}
