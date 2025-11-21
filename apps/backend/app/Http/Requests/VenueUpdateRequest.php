<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VenueUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $venue = $this->route('venue');
        $venueId = is_object($venue) ? $venue->id : $venue;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('venues', 'email')->ignore($venueId)],
            'phone' => ['sometimes', 'string', 'max:20'],
            'rif' => ['sometimes', 'string', 'max:50', Rule::unique('venues', 'rif')->ignore($venueId)],
            'status' => ['sometimes', 'in:pending,approved,rejected'],
            'neighborhood' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'rating' => ['nullable', 'numeric', 'between:0,5'],
            'logo_url' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ];
    }
}
