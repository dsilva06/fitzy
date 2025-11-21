<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\VenueStoreRequest;
use App\Http\Requests\VenueUpdateRequest;
use App\Enums\VenueStatus;
use App\Models\Status;

class VenueController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = Venue::query();
        $user = $request->user();

        if (! $user || $user->role !== 'owner') {
            $query->where('status', VenueStatus::Approved->value);
        }

        if ($request->boolean('with_admins')) {
            if (! $user || $user->role !== 'owner') {
                abort(403, 'Forbidden.');
            }

            $query->with(['venueAdmins' => fn ($adminQuery) => $adminQuery->orderBy('created_at')]);
        }

        $this->applyFilters($query, $request, ['id', 'city', 'neighborhood', 'status']);
        $this->applySorting($query, $request, ['name', 'rating', 'created_at'], 'name');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(VenueStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $statusValue = $data['status'] ?? VenueStatus::Pending->value;
        $statusId = Status::idFor(Venue::class, $statusValue);

        $venue = Venue::create(array_merge($data, [
            'status' => $statusValue,
            'status_id' => $statusId,
        ]));

        return response()->json($venue, 201);
    }

    public function show(Request $request, Venue $venue): JsonResponse
    {
        $user = $request->user();

        if ((! $user || $user->role !== 'owner') && $venue->status !== VenueStatus::Approved->value) {
            abort(404);
        }

        if ($request->boolean('with_admins') && $user && $user->role === 'owner') {
            $venue->loadMissing(['venueAdmins' => fn ($adminQuery) => $adminQuery->orderBy('created_at')]);
        }

        return response()->json($venue);
    }

    public function update(VenueUpdateRequest $request, Venue $venue): JsonResponse
    {
        $data = $request->validated();
        $statusId = null;

        if (array_key_exists('status', $data)) {
            $statusId = Status::idFor(Venue::class, $data['status']);
        }

        $venue->fill($data)->save();

        if ($statusId) {
            $venue->forceFill(['status_id' => $statusId])->save();
        }

        return response()->json($venue);
    }

    public function destroy(Venue $venue): JsonResponse
    {
        $venue->delete();

        return response()->json(status: 204);
    }

    public function approve(Request $request, Venue $venue): JsonResponse
    {
        $data = $request->validate([
            'note' => ['nullable', 'string'],
        ]);

        $venue->forceFill([
            'status' => VenueStatus::Approved->value,
            'status_id' => Status::idFor(Venue::class, VenueStatus::Approved->value),
            'status_note' => $data['note'] ?? null,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ])->save();

        return response()->json($venue->fresh()->load('venueAdmins'));
    }

    public function reject(Request $request, Venue $venue): JsonResponse
    {
        $data = $request->validate([
            'note' => ['nullable', 'string'],
        ]);

        $venue->forceFill([
            'status' => VenueStatus::Rejected->value,
            'status_id' => Status::idFor(Venue::class, VenueStatus::Rejected->value),
            'status_note' => $data['note'] ?? null,
            'approved_at' => null,
            'approved_by' => $request->user()->id,
        ])->save();

        return response()->json($venue->fresh()->load('venueAdmins'));
    }
}
