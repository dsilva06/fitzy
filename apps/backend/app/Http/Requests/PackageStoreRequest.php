<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PackageStoreRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'credits' => ['nullable', 'integer', 'min:0'],
            'validity_months' => ['nullable', 'integer', 'min:0'],
            'venue_id' => ['required', 'exists:venues,id'],
            'class_type_id' => ['required', 'exists:class_types,id'],
        ];
    }
}
