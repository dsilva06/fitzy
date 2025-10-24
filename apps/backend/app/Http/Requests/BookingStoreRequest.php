<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookingStoreRequest extends FormRequest
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
            'session_id' => ['required', 'exists:class_sessions,id'],
            'status' => ['nullable', 'string', 'max:50'],
            'cancellation_deadline' => ['nullable', 'date'],
        ];
    }
}
