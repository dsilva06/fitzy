<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\PackageStoreRequest;
use App\Http\Requests\PackageUpdateRequest;
use Illuminate\Support\Arr;

class PackageController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = Package::with(['venue', 'classType']);

        $this->applyFilters($query, $request, ['id', 'venue_id', 'class_type_id']);

        if ($request->filled('category_name')) {
            $names = Arr::wrap($request->query('category_name'));
            $query->whereHas('classType', function ($q) use ($names) {
                $q->whereIn('name', $names);
            });
        }
        $this->applySorting($query, $request, ['created_at', 'price', 'name'], 'name');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(PackageStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $package = Package::create($data);

        return response()->json($package->fresh(['venue', 'classType']), 201);
    }

    public function show(Package $package): JsonResponse
    {
        return response()->json($package->load(['venue', 'classType']));
    }

    public function update(PackageUpdateRequest $request, Package $package): JsonResponse
    {
        $data = $request->validated();

        $package->fill($data)->save();

        return response()->json($package->fresh(['venue', 'classType']));
    }

    public function destroy(Package $package): JsonResponse
    {
        $package->delete();

        return response()->json(status: 204);
    }

}
