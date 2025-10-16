<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ClassSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = Booking::with(['session', 'session.venue', 'session.classType']);

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
            'cancellation_deadline' => ['nullable', 'date'],
        ]);

        $booking = DB::transaction(function () use ($data) {
            $booking = Booking::firstOrCreate(
                [
                    'user_id' => $data['user_id'],
                    'session_id' => $data['session_id'],
                ],
                [
                    'status' => $data['status'] ?? 'pending',
                    'cancellation_deadline' => $data['cancellation_deadline'] ?? null,
                ]
            );

            return $booking;
        });

        return response()->json($booking->fresh(['session', 'session.venue', 'session.classType']), $booking->wasRecentlyCreated ? 201 : 200);
    }

    public function show(Booking $booking): JsonResponse
    {
        return response()->json($booking->load(['session', 'session.venue', 'session.classType']));
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'string', 'max:50'],
            'cancellation_deadline' => ['nullable', 'date'],
        ]);

        $booking->fill($data)->save();

        return response()->json($booking->fresh(['session', 'session.venue', 'session.classType']));
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();

        return response()->json(status: 204);
    }
}
