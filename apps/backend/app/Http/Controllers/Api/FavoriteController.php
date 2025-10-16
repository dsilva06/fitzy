<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = Favorite::with('venue');

        $this->applyFilters($query, $request, ['id', 'user_id', 'venue_id']);
        $this->applySorting($query, $request, ['created_at'], 'created_at');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'venue_id' => ['required', 'exists:venues,id'],
        ]);

        $favorite = Favorite::firstOrCreate($data);

        return response()->json($favorite->fresh('venue'), $favorite->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Favorite $favorite): JsonResponse
    {
        $favorite->delete();

        return response()->json(status: 204);
    }
}
