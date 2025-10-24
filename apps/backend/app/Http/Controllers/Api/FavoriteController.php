<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\FavoriteStoreRequest;

class FavoriteController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $query = $user->favorites()
            ->with('venue')
            ->getQuery();

        $this->applyFilters($query, $request, ['id', 'venue_id']);
        $this->applySorting($query, $request, ['created_at'], 'created_at');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(FavoriteStoreRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $data = $request->validated();

        $favorite = $user->favorites()->firstOrCreate([
            'venue_id' => $data['venue_id'],
        ]);

        return response()->json($favorite->fresh('venue'), $favorite->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, Favorite $favorite): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        if ($favorite->user_id !== $user->id) {
            abort(403, 'You are not authorized to delete this favorite.');
        }

        $favorite->delete();

        return response()->json(status: 204);
    }
}
