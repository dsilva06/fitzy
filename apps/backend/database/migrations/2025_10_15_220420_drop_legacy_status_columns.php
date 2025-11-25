<?php

use App\Enums\VenueStatus;
use App\Models\Booking;
use App\Models\PackageOwnership;
use App\Models\Payment;
use App\Models\Venue;
use App\Models\WaitlistEntry;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('venues', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('package_ownerships', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('waitlist_entries', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }

    public function down(): void
    {
        Schema::table('venues', function (Blueprint $table) {
            $table->string('status')->default(VenueStatus::Pending->value)->after('description');
        });

        Schema::table('package_ownerships', function (Blueprint $table) {
            $table->string('status')->default('active')->after('credits_remaining');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('session_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('amount');
        });

        Schema::table('waitlist_entries', function (Blueprint $table) {
            $table->string('status')->default('active')->after('session_id');
        });

        $this->restoreStatusColumns();
    }

    private function restoreStatusColumns(): void
    {
        $mappings = [
            'venues' => [
                'model' => Venue::class,
                'default' => VenueStatus::Pending->value,
            ],
            'package_ownerships' => [
                'model' => PackageOwnership::class,
                'default' => 'active',
            ],
            'bookings' => [
                'model' => Booking::class,
                'default' => 'pending',
            ],
            'payments' => [
                'model' => Payment::class,
                'default' => 'pending',
            ],
            'waitlist_entries' => [
                'model' => WaitlistEntry::class,
                'default' => 'active',
            ],
        ];

        foreach ($mappings as $table => $config) {
            DB::table($table)
                ->orderBy('id')
                ->lazy()
                ->each(function ($record) use ($table, $config) {
                    $status = DB::table('statuses')
                        ->where('id', $record->status_id)
                        ->where('model_binding', $config['model'])
                        ->value('description');

                    DB::table($table)
                        ->where('id', $record->id)
                        ->update(['status' => $status ?? $config['default']]);
                });
        }
    }
};
