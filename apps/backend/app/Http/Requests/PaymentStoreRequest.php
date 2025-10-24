<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'booking_id' => ['required', 'exists:bookings,id'],
            'method' => ['required', 'string', 'max:50'],
            'amount' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'max:50'],
            'meta' => ['nullable', 'array'],
        ];
    }
}
