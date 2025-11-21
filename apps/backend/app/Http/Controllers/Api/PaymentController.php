<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\PaymentStoreRequest;
use App\Http\Requests\PaymentUpdateRequest;
use App\Models\Status;

class PaymentController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = Payment::with('booking');

        $this->applyFilters($query, $request, ['id', 'booking_id', 'status']);
        $this->applySorting($query, $request, ['created_at'], 'created_at');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(PaymentStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $statusValue = $data['status'] ?? 'pending';
        $statusId = Status::idFor(Payment::class, $statusValue);

        $payment = Payment::create([
            'booking_id' => $data['booking_id'],
            'method' => $data['method'],
            'amount' => $data['amount'],
            'status' => $statusValue,
            'status_id' => $statusId,
            'meta' => $data['meta'] ?? null,
        ]);

        if (! $payment->status_id && $statusId) {
            $payment->forceFill(['status_id' => $statusId])->save();
        }

        return response()->json($payment->fresh('booking'), 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json($payment->load('booking'));
    }

    public function update(PaymentUpdateRequest $request, Payment $payment): JsonResponse
    {
        $data = $request->validated();
        $statusId = null;

        if (array_key_exists('status', $data)) {
            $statusId = Status::idFor(Payment::class, $data['status']);
        }

        $payment->fill($data)->save();

        if ($statusId) {
            $payment->forceFill(['status_id' => $statusId])->save();
        }

        return response()->json($payment->fresh('booking'));
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $payment->delete();

        return response()->json(status: 204);
    }
}
