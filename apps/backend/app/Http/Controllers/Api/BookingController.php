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
use App\Models\Status;

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
        $statusValue = $data['status'] ?? 'pending';
        $statusId = Status::idFor(Booking::class, $statusValue);

        $booking = DB::transaction(function () use ($data, $statusValue, $statusId) {
            $booking = Booking::firstOrCreate(
                [
                    'user_id' => $data['user_id'],
                    'session_id' => $data['session_id'],
                ],
                [
                    'status' => $statusValue,
                    'status_id' => $statusId,
                    'cancellation_deadline' => $data['cancellation_deadline'] ?? null,
                ]
            );

            if (! $booking->status_id && $statusId) {
                $booking->forceFill(['status_id' => $statusId])->save();
            }

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
        $statusId = null;

        if (array_key_exists('status', $data)) {
            $statusId = Status::idFor(Booking::class, $data['status']);
        }

        $booking->fill($data)->save();

        if ($statusId) {
            $booking->forceFill(['status_id' => $statusId])->save();
        }

        return response()->json($booking->fresh(['session', 'session.venue', 'session.classType']));
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();

        return response()->json(status: 204);
    }
}
