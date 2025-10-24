<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentMethodUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_default')) {
            $this->merge([
                'is_default' => filter_var($this->input('is_default'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'string', 'max:50'],
            'card_brand' => ['nullable', 'string', 'max:100'],
            'masked_details' => ['nullable', 'string', 'max:255'],
            'card_expiry' => ['nullable', 'string', 'max:10'],
            'account_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_default' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],
        ];
    }
}
