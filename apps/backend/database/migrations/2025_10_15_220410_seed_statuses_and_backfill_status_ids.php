<?php

use App\Enums\VenueStatus;
use App\Models\Booking;
use App\Models\PackageOwnership;
use App\Models\Payment;
use App\Models\Venue;
use App\Models\WaitlistEntry;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $statusDefinitions = [
        Venue::class => [
            ['value' => VenueStatus::Pending->value, 'icon' => 'Clock', 'color' => '#FBBF24'],
            ['value' => VenueStatus::Approved->value, 'icon' => 'CheckCircle', 'color' => '#34D399'],
            ['value' => VenueStatus::Rejected->value, 'icon' => 'XCircle', 'color' => '#F87171'],
        ],
        Booking::class => [
            ['value' => 'pending', 'icon' => 'Clock', 'color' => '#FBBF24'],
            ['value' => 'confirmed', 'icon' => 'CheckCircle', 'color' => '#34D399'],
        ],
        Payment::class => [
            ['value' => 'pending', 'icon' => 'Clock', 'color' => '#FBBF24'],
        ],
        PackageOwnership::class => [
            ['value' => 'active', 'icon' => 'Activity', 'color' => '#60A5FA'],
        ],
        WaitlistEntry::class => [
            ['value' => 'active', 'icon' => 'Bell', 'color' => '#C084FC'],
        ],
    ];

    private array $tableMap = [
        Venue::class => 'venues',
        Booking::class => 'bookings',
        Payment::class => 'payments',
        PackageOwnership::class => 'package_ownerships',
        WaitlistEntry::class => 'waitlist_entries',
    ];

    public function up(): void
    {
        $now = now();

        foreach ($this->statusDefinitions as $model => $states) {
            foreach ($states as $state) {
                DB::table('statuses')->updateOrInsert(
                    [
                        'model_binding' => $model,
                        'description' => $state['value'],
                    ],
                    [
                        'icon' => $state['icon'] ?? null,
                        'color' => $state['color'] ?? null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        foreach ($this->statusDefinitions as $model => $states) {
            $table = $this->tableMap[$model];

            foreach ($states as $state) {
                $statusId = DB::table('statuses')
                    ->where('model_binding', $model)
                    ->where('description', $state['value'])
                    ->value('id');

                if (!$statusId) {
                    continue;
                }

                DB::table($table)
                    ->whereNull('status_id')
                    ->where('status', $state['value'])
                    ->update(['status_id' => $statusId]);
            }
        }

        $pendingVenueStatusId = DB::table('statuses')
            ->where('model_binding', Venue::class)
            ->where('description', VenueStatus::Pending->value)
            ->value('id');

        if ($pendingVenueStatusId) {
            DB::table('venues')
                ->whereNull('status_id')
                ->update([
                    'status_id' => $pendingVenueStatusId,
                    'status' => VenueStatus::Pending->value,
                ]);
        }
    }

    public function down(): void
    {
        foreach ($this->statusDefinitions as $model => $states) {
            $table = $this->tableMap[$model];

            $statusIds = DB::table('statuses')
                ->where('model_binding', $model)
                ->whereIn('description', array_column($states, 'value'))
                ->pluck('id');

            if ($statusIds->isEmpty()) {
                continue;
            }

            DB::table($table)
                ->whereIn('status_id', $statusIds)
                ->update(['status_id' => null]);

            DB::table('statuses')
                ->whereIn('id', $statusIds)
                ->delete();
        }
    }
};
