<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\WaitlistEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\WaitlistEntryStoreRequest;
use App\Http\Requests\WaitlistEntryUpdateRequest;
use App\Models\Status;

class WaitlistEntryController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = WaitlistEntry::with(['session', 'session.venue']);

        $this->applyFilters($query, $request, ['id', 'user_id', 'session_id']);
        $this->applyStatusFilter($query, $request, WaitlistEntry::class);
        $this->applySorting($query, $request, ['created_at'], 'created_at');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(WaitlistEntryStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $statusValue = $data['status'] ?? 'active';
        $statusId = Status::idFor(WaitlistEntry::class, $statusValue);

        $entry = WaitlistEntry::firstOrCreate(
            [
                'user_id' => $data['user_id'],
                'session_id' => $data['session_id'],
            ],
            [
                'status' => $statusValue,
                'status_id' => $statusId,
            ]
        );

        if (! $entry->status_id && $statusId) {
            $entry->forceFill(['status_id' => $statusId])->save();
        }

        return response()->json($entry->fresh(['session', 'session.venue']), $entry->wasRecentlyCreated ? 201 : 200);
    }

    public function update(WaitlistEntryUpdateRequest $request, WaitlistEntry $waitlistEntry): JsonResponse
    {
        $data = $request->validated();
        $statusId = null;

        if (array_key_exists('status', $data)) {
            $statusId = Status::idFor(WaitlistEntry::class, $data['status']);
        }

        $waitlistEntry->fill($data)->save();

        if ($statusId) {
            $waitlistEntry->forceFill(['status_id' => $statusId])->save();
        }

        return response()->json($waitlistEntry->fresh(['session', 'session.venue']));
    }

    public function destroy(WaitlistEntry $waitlistEntry): JsonResponse
    {
        $waitlistEntry->delete();

        return response()->json(status: 204);
    }
}
