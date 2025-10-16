<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VenueController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = Venue::query();

        $this->applyFilters($query, $request, ['id', 'city', 'neighborhood']);
        $this->applySorting($query, $request, ['name', 'rating', 'created_at'], 'name');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'neighborhood' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'rating' => ['nullable', 'numeric', 'between:0,5'],
            'logo_url' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $venue = Venue::create($data);

        return response()->json($venue, 201);
    }

    public function show(Venue $venue): JsonResponse
    {
        return response()->json($venue);
    }

    public function update(Request $request, Venue $venue): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'neighborhood' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'rating' => ['nullable', 'numeric', 'between:0,5'],
            'logo_url' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $venue->fill($data)->save();

        return response()->json($venue);
    }

    public function destroy(Venue $venue): JsonResponse
    {
        $venue->delete();

        return response()->json(status: 204);
    }
}
