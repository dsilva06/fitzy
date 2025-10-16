<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentMethodController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = PaymentMethod::query();

        $this->applyFilters($query, $request, ['id', 'user_id', 'type', 'is_default']);
        $this->applySorting($query, $request, ['created_at'], 'created_at');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);

        $paymentMethod = DB::transaction(function () use ($data) {
            $method = PaymentMethod::create($data);

            if ($method->is_default) {
                PaymentMethod::where('user_id', $method->user_id)
                    ->where('id', '!=', $method->id)
                    ->update(['is_default' => false]);
            }

            return $method;
        });

        return response()->json($paymentMethod, 201);
    }

    public function show(PaymentMethod $paymentMethod): JsonResponse
    {
        return response()->json($paymentMethod);
    }

    public function update(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $data = $this->validatedData($request, partial: true);

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

    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->delete();

        return response()->json(status: 204);
    }

    protected function validatedData(Request $request, bool $partial = false): array
    {
        $rules = [
            'user_id' => [$partial ? 'sometimes' : 'required', 'exists:users,id'],
            'type' => [$partial ? 'sometimes' : 'required', 'string', 'max:50'],
            'card_brand' => ['nullable', 'string', 'max:100'],
            'masked_details' => ['nullable', 'string', 'max:255'],
            'card_expiry' => ['nullable', 'string', 'max:10'],
            'account_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_default' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],
        ];

        $data = $request->validate($rules);

        if (array_key_exists('is_default', $data)) {
            $data['is_default'] = (bool) $data['is_default'];
        }

        return $data;
    }
}
