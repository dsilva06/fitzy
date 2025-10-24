<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\PackageStoreRequest;
use App\Http\Requests\PackageUpdateRequest;

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

    public function store(PackageStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $package = Package::create($data);

        return response()->json($package->fresh('venue'), 201);
    }

    public function show(Package $package): JsonResponse
    {
        return response()->json($package->load('venue'));
    }

    public function update(PackageUpdateRequest $request, Package $package): JsonResponse
    {
        $data = $request->validated();

        $package->fill($data)->save();

        return response()->json($package->fresh('venue'));
    }

    public function destroy(Package $package): JsonResponse
    {
        $package->delete();

        return response()->json(status: 204);
    }

}
