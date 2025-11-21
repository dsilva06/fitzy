<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VenueStoreRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:venues,email'],
            'phone' => ['required', 'string', 'max:20'],
            'rif' => ['required', 'string', 'max:50', 'unique:venues,rif'],
            'website' => ['nullable', 'url', 'max:255'],
            'status' => ['required', 'in:pending,approved,rejected'],
            'venue_type' => ['required', 'in:class_studio,retail_store,other'],
            'neighborhood' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'rating' => ['nullable', 'numeric', 'between:0,5'],
            'logo_url' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ];
    }
}
