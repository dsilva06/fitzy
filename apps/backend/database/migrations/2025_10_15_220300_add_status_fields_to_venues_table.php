<?php

use App\Enums\VenueStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('venues', function (Blueprint $table) {
            $table->string('status')->default(VenueStatus::Pending->value)->after('description');
            $table->text('status_note')->nullable()->after('status');
            $table->timestamp('approved_at')->nullable()->after('status_note');
            $table->foreignId('approved_by')
                ->nullable()
                ->after('approved_at')
                ->constrained('users')
                ->nullOnDelete();
        });

        DB::table('venues')
            ->whereNull('status')
            ->orWhere('status', '')
            ->update(['status' => VenueStatus::Approved->value, 'approved_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('venues', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['status', 'status_note', 'approved_at', 'approved_by']);
        });
    }
};
