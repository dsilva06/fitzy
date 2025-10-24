<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PackageOwnershipStoreRequest extends FormRequest
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
            'user_id' => ['required', 'exists:users,id'],
            'package_id' => ['required', 'exists:packages,id'],
            'credits_total' => ['nullable', 'integer', 'min:0'],
            'credits_remaining' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string', 'max:50'],
            'purchased_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
