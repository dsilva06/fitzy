<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\PaymentMethodType;

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
            'type' => ['sometimes', Rule::in(PaymentMethodType::values())],
            'card_brand' => ['nullable', 'string', 'max:100'],
            'masked_details' => ['nullable', 'string', 'max:255'],
            'card_expiry' => ['nullable', 'string', 'max:10'],
            'account_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'document_id' => ['nullable', 'string', 'max:50'],
            'is_default' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $type = $this->input('type');

            if (! $type) {
                return;
            }

            $required = match ($type) {
                PaymentMethodType::Zelle->value => ['account_name', 'email'],
                PaymentMethodType::PagoMovil->value => ['account_name', 'phone', 'bank_name', 'document_id'],
                PaymentMethodType::Card->value => ['card_brand', 'masked_details', 'card_expiry'],
                PaymentMethodType::Binance->value => ['account_name', 'email'],
                default => [],
            };

            foreach ($required as $field) {
                if ($this->filled($field)) {
                    continue;
                }

                $validator->errors()->add($field, __('validation.required', ['attribute' => str_replace('_', ' ', $field)]));
            }
        });
    }
}
