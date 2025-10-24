<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClassSessionUpdateRequest extends FormRequest
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
            'venue_id' => ['sometimes', 'exists:venues,id'],
            'class_type_id' => ['sometimes', 'exists:class_types,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'coach_name' => ['nullable', 'string', 'max:255'],
            'start_datetime' => ['sometimes', 'date'],
            'end_datetime' => ['sometimes', 'date', 'after:start_datetime'],
            'capacity_total' => ['nullable', 'integer', 'min:0'],
            'capacity_taken' => ['nullable', 'integer', 'min:0'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'credit_cost' => ['nullable', 'integer', 'min:0'],
            'level' => ['nullable', 'string', 'max:255'],
        ];
    }
}
