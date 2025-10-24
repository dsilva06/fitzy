<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\PaymentMethodStoreRequest;
use App\Http\Requests\PaymentMethodUpdateRequest;

class PaymentMethodController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $query = $user->paymentMethods()->newQuery();

        $this->applyFilters($query, $request, ['id', 'type', 'is_default']);
        $this->applySorting($query, $request, ['created_at'], 'created_at');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(PaymentMethodStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $paymentMethod = DB::transaction(function () use ($user, $data) {
            /** @var \App\Models\PaymentMethod $method */
            $method = $user->paymentMethods()->create($data);

            if ($method->is_default) {
                PaymentMethod::where('user_id', $user->id)
                    ->where('id', '!=', $method->id)
                    ->update(['is_default' => false]);
            }

            return $method;
        });

        return response()->json($paymentMethod, 201);
    }

    public function show(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        if ($paymentMethod->user_id !== $user->id) {
            abort(403, 'You are not authorized to view this payment method.');
        }

        return response()->json($paymentMethod);
    }

    public function update(PaymentMethodUpdateRequest $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        if ($paymentMethod->user_id !== $user->id) {
            abort(403, 'You are not authorized to update this payment method.');
        }

        $data = $request->validated();

        DB::transaction(function () use ($paymentMethod, $data) {
            $paymentMethod->fill($data)->save();

            if (array_key_exists('is_default', $data) && $data['is_default']) {
                PaymentMethod::where('user_id', $paymentMethod->user_id)
                    ->where('id', '!=', $paymentMethod->id)
                    ->update(['is_default' => false]);
            }
        });

        return response()->json($paymentMethod->fresh());
    }

    public function destroy(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        if ($paymentMethod->user_id !== $user->id) {
            abort(403, 'You are not authorized to delete this payment method.');
        }

        $paymentMethod->delete();

        return response()->json(status: 204);
    }
}
