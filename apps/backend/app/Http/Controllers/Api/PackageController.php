<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = Package::with('venue');

        $this->applyFilters($query, $request, ['id', 'venue_id', 'category_name']);
        $this->applySorting($query, $request, ['created_at', 'price', 'name'], 'name');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);

        $package = Package::create($data);

        return response()->json($package->fresh('venue'), 201);
    }

    public function show(Package $package): JsonResponse
    {
        return response()->json($package->load('venue'));
    }

    public function update(Request $request, Package $package): JsonResponse
    {
        $data = $this->validatedData($request, partial: true);

        $package->fill($data)->save();

        return response()->json($package->fresh('venue'));
    }

    public function destroy(Package $package): JsonResponse
    {
        $package->delete();

        return response()->json(status: 204);
    }

    protected function validatedData(Request $request, bool $partial = false): array
    {
        $rules = [
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'credits' => ['nullable', 'integer', 'min:0'],
            'validity_months' => ['nullable', 'integer', 'min:0'],
            'category_name' => ['nullable', 'string', 'max:255'],
            'venue_id' => ['nullable', 'exists:venues,id'],
        ];

        return $request->validate($rules);
    }
}
