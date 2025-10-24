<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ClassSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\BookingStoreRequest;
use App\Http\Requests\BookingUpdateRequest;
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

    public function store(BookingStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

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

    public function update(BookingUpdateRequest $request, Booking $booking): JsonResponse
    {
        $data = $request->validated();

        $booking->fill($data)->save();

        return response()->json($booking->fresh(['session', 'session.venue', 'session.classType']));
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();

        return response()->json(status: 204);
    }
}
