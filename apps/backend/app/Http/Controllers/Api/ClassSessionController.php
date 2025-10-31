<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\InteractsWithQueryParameters;
use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\ClassSessionStoreRequest;
use App\Http\Requests\ClassSessionUpdateRequest;

class ClassSessionController extends Controller
{
    use InteractsWithQueryParameters;

    public function index(Request $request): JsonResponse
    {
        $query = ClassSession::with([
            'venue',
            'classType',
            'instructor',
            'waitlistEntries' => function ($q) {
                $q->where('status', 'active')
                    ->orderBy('created_at')
                    ->with('user:id,first_name,last_name,name,email');
            },
        ])->withCount([
            'bookings as bookings_confirmed_count' => function ($q) {
                $q->where('status', 'confirmed');
            },
            'waitlistEntries as waitlist_active_count' => function ($q) {
                $q->where('status', 'active');
            },
        ]);

        $this->applyFilters($query, $request, ['id', 'venue_id', 'class_type_id']);
        $this->applySorting($query, $request, ['start_datetime', 'end_datetime', 'created_at'], 'start_datetime');
        $this->applyLimit($query, $request);

        if ($request->filled('venue')) {
            $venue = $request->query('venue');
            $query->whereHas('venue', fn ($q) => $q->where('name', $venue));
        }

        if ($request->filled('month')) {
            $month = CarbonImmutable::parse($request->query('month'));
            $query->whereBetween('start_datetime', [
                $month->startOfMonth(),
                $month->endOfMonth(),
            ]);
        }

        if ($request->filled('date')) {
            $date = CarbonImmutable::parse($request->query('date'));
            $query->whereBetween('start_datetime', [
                $date->startOfDay(),
                $date->endOfDay(),
            ]);
        }

        return response()->json($query->get());
    }

    public function store(ClassSessionStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $session = ClassSession::create($data);

        if (! empty($data['instructor_id']) && empty($data['coach_name'])) {
            $session->coach_name = $session->instructor?->name;
            $session->save();
        }

        $session->load([
            'venue',
            'classType',
            'instructor',
            'waitlistEntries' => function ($q) {
                $q->where('status', 'active')
                    ->orderBy('created_at')
                    ->with('user:id,first_name,last_name,name,email');
            },
        ])
            ->loadCount([
                'bookings as bookings_confirmed_count' => function ($q) {
                    $q->where('status', 'confirmed');
                },
                'waitlistEntries as waitlist_active_count' => function ($q) {
                    $q->where('status', 'active');
                },
            ]);

        return response()->json($session, 201);
    }

    public function show(ClassSession $classSession): JsonResponse
    {
        $classSession->load([
            'venue',
            'classType',
            'instructor',
            'waitlistEntries' => function ($q) {
                $q->where('status', 'active')
                    ->orderBy('created_at')
                    ->with('user:id,first_name,last_name,name,email');
            },
        ])
            ->loadCount([
                'bookings as bookings_confirmed_count' => function ($q) {
                    $q->where('status', 'confirmed');
                },
                'waitlistEntries as waitlist_active_count' => function ($q) {
                    $q->where('status', 'active');
                },
            ]);

        return response()->json($classSession);
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

        if (array_key_exists('instructor_id', $data) && empty($data['coach_name'])) {
            $classSession->coach_name = $classSession->instructor?->name;
            $classSession->save();
        }

        $classSession->load([
            'venue',
            'classType',
            'instructor',
            'waitlistEntries' => function ($q) {
                $q->where('status', 'active')
                    ->orderBy('created_at')
                    ->with('user:id,first_name,last_name,name,email');
            },
        ])
            ->loadCount([
                'bookings as bookings_confirmed_count' => function ($q) {
                    $q->where('status', 'confirmed');
                },
                'waitlistEntries as waitlist_active_count' => function ($q) {
                    $q->where('status', 'active');
                },
            ]);

        return response()->json($classSession);
    }

    public function destroy(ClassSession $classSession): JsonResponse
    {
        $classSession->delete();

        return response()->json(status: 204);
    }

}
