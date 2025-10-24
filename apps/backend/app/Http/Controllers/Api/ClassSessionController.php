<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\ClassSessionStoreRequest;
use App\Http\Requests\ClassSessionUpdateRequest;

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

    public function store(ClassSessionStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $session = ClassSession::create($data);

        return response()->json($session->fresh(['venue', 'classType']), 201);
    }

    public function show(ClassSession $classSession): JsonResponse
    {
        return response()->json($classSession->load(['venue', 'classType']));
    }

    public function update(ClassSessionUpdateRequest $request, ClassSession $classSession): JsonResponse
    {
        $data = $request->validated();

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

}
