<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\PackageOwnership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\PackageOwnershipStoreRequest;
use App\Http\Requests\PackageOwnershipUpdateRequest;

class PackageOwnershipController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = PackageOwnership::with(['package', 'package.venue']);

        $this->applyFilters($query, $request, ['id', 'user_id', 'package_id', 'status']);
        $this->applySorting($query, $request, ['purchased_at', 'expires_at', 'created_at'], 'purchased_at');
        $this->applyLimit($query, $request);

        return response()->json($query->get());
    }

    public function store(PackageOwnershipStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $ownership = PackageOwnership::create($data);

        return response()->json($ownership->fresh(['package', 'package.venue']), 201);
    }

    public function show(PackageOwnership $packageOwnership): JsonResponse
    {
        return response()->json($packageOwnership->load(['package', 'package.venue']));
    }

    public function update(PackageOwnershipUpdateRequest $request, PackageOwnership $packageOwnership): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('credits_remaining', $data)) {
            $data['credits_remaining'] = max(0, $data['credits_remaining']);
        }

        $packageOwnership->fill($data)->save();

        return response()->json($packageOwnership->fresh(['package', 'package.venue']));
    }

    public function destroy(PackageOwnership $packageOwnership): JsonResponse
    {
        $packageOwnership->delete();

        return response()->json(status: 204);
    }
}
