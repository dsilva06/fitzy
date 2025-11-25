<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PackageUpdateRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'credits' => ['nullable', 'integer', 'min:0'],
            'validity_months' => ['nullable', 'integer', 'min:0'],
            'venue_id' => ['sometimes', 'exists:venues,id'],
            'class_type_id' => ['sometimes', 'exists:class_types,id'],
        ];
    }
}
