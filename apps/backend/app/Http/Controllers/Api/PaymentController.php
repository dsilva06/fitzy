<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\PaymentStoreRequest;
use App\Http\Requests\PaymentUpdateRequest;

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

        $payment = Payment::create([
            'booking_id' => $data['booking_id'],
            'method' => $data['method'],
            'amount' => $data['amount'],
            'status' => $data['status'] ?? 'pending',
            'meta' => $data['meta'] ?? null,
        ]);

        return response()->json($payment->fresh('booking'), 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json($payment->load('booking'));
    }

    public function update(PaymentUpdateRequest $request, Payment $payment): JsonResponse
    {
        $data = $request->validated();

        $payment->fill($data)->save();

        return response()->json($payment->fresh('booking'));
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $payment->delete();

        return response()->json(status: 204);
    }
}
