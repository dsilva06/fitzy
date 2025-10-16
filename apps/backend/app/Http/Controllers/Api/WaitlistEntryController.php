<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\WaitlistEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WaitlistEntryController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = WaitlistEntry::with(['session', 'session.venue']);

        $this->applyFilters($query, $request, ['id', 'user_id', 'session_id', 'status']);
        $this->applySorting($query, $request, ['created_at'], 'created_at');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'session_id' => ['required', 'exists:class_sessions,id'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $entry = WaitlistEntry::firstOrCreate(
            [
                'user_id' => $data['user_id'],
                'session_id' => $data['session_id'],
            ],
            [
                'status' => $data['status'] ?? 'active',
            ]
        );

        return response()->json($entry->fresh(['session', 'session.venue']), $entry->wasRecentlyCreated ? 201 : 200);
    }

    public function update(Request $request, WaitlistEntry $waitlistEntry): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $waitlistEntry->fill($data)->save();

        return response()->json($waitlistEntry->fresh(['session', 'session.venue']));
    }

    public function destroy(WaitlistEntry $waitlistEntry): JsonResponse
    {
        $waitlistEntry->delete();

        return response()->json(status: 204);
    }
}
