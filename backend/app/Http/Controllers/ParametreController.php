<?php

namespace App\Http\Controllers;

class ParametreController extends Controller
{
    public function index()
    {
        return response()->json([
            'whatsapp_numero' => config('app.whatsapp_numero'),
        ]);
    }
}