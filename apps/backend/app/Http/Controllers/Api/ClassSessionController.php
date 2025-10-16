<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassSessionController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = ClassSession::with(['venue', 'classType']);

        $this->applyFilters($query, $request, ['id', 'venue_id', 'class_type_id']);
        $this->applySorting($query, $request, ['start_datetime', 'end_datetime', 'created_at'], 'start_datetime');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);

        $session = ClassSession::create($data);

        return response()->json($session->fresh(['venue', 'classType']), 201);
    }

    public function show(ClassSession $classSession): JsonResponse
    {
        return response()->json($classSession->load(['venue', 'classType']));
    }

    public function update(Request $request, ClassSession $classSession): JsonResponse
    {
        $data = $this->validatedData($request, partial: true);

        if (array_key_exists('capacity_taken', $data)) {
            $data['capacity_taken'] = max(0, min(
                $data['capacity_taken'],
                $data['capacity_total'] ?? $classSession->capacity_total
            ));
        }

        $classSession->fill($data)->save();

        return response()->json($classSession->fresh(['venue', 'classType']));
    }

    public function destroy(ClassSession $classSession): JsonResponse
    {
        $classSession->delete();

        return response()->json(status: 204);
    }

    protected function validatedData(Request $request, bool $partial = false): array
    {
        $rules = [
            'venue_id' => [$partial ? 'sometimes' : 'required', 'exists:venues,id'],
            'class_type_id' => [$partial ? 'sometimes' : 'required', 'exists:class_types,id'],
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'coach_name' => ['nullable', 'string', 'max:255'],
            'start_datetime' => [$partial ? 'sometimes' : 'required', 'date'],
            'end_datetime' => [$partial ? 'sometimes' : 'required', 'date', 'after:start_datetime'],
            'capacity_total' => ['nullable', 'integer', 'min:0'],
            'capacity_taken' => ['nullable', 'integer', 'min:0'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'credit_cost' => ['nullable', 'integer', 'min:0'],
            'level' => ['nullable', 'string', 'max:255'],
        ];

        return $request->validate($rules);
    }
}
