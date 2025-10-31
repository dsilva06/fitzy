<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VenueInstructor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VenueInstructorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = VenueInstructor::query()->with('venue');

        if ($request->filled('venue_id')) {
            $query->where('venue_id', $request->integer('venue_id'));
        }

        if ($request->filled('venue')) {
            $query->whereHas('venue', fn ($q) => $q->where('name', $request->query('venue')));
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'venue_id' => ['required', 'exists:venues,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $instructor = VenueInstructor::create($data);

        return response()->json($instructor->fresh('venue'), 201);
    }

    public function update(Request $request, VenueInstructor $instructor): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'avatar_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ]);

        $instructor->fill($data)->save();

        return response()->json($instructor->fresh('venue'));
    }

    public function destroy(VenueInstructor $instructor): JsonResponse
    {
        $instructor->delete();

        return response()->json(status: 204);
    }
}
