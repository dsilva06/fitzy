<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\ClassType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassTypeController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = ClassType::query();

        $this->applyFilters($query, $request, ['id', 'name']);
        $this->applySorting($query, $request, ['name', 'created_at'], 'name');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $classType = ClassType::create($data);

        return response()->json($classType, 201);
    }

    public function show(ClassType $classType): JsonResponse
    {
        return response()->json($classType);
    }

    public function update(Request $request, ClassType $classType): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $classType->fill($data)->save();

        return response()->json($classType);
    }

    public function destroy(ClassType $classType): JsonResponse
    {
        $classType->delete();

        return response()->json(status: 204);
    }
}
