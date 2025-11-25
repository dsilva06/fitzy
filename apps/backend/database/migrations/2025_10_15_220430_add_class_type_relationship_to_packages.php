<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('packages', 'class_type_id')) {
            Schema::table('packages', function (Blueprint $table) {
                $table->foreignId('class_type_id')
                    ->nullable()
                    ->after('venue_id')
                    ->constrained('class_types')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasColumn('packages', 'category_name')) {
            DB::table('packages')
                ->orderBy('id')
                ->lazy()
                ->each(function ($package) {
                    if (! $package->category_name) {
                        return;
                    }

                    $classTypeId = DB::table('class_types')
                        ->where('name', $package->category_name)
                        ->value('id');

                    if ($classTypeId) {
                        DB::table('packages')
                            ->where('id', $package->id)
                            ->update(['class_type_id' => $classTypeId]);
                    }
                });

            Schema::table('packages', function (Blueprint $table) {
                $table->dropColumn('category_name');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('packages', 'category_name')) {
            Schema::table('packages', function (Blueprint $table) {
                $table->string('category_name')->nullable()->after('validity_months');
            });
        }

        if (Schema::hasColumn('packages', 'class_type_id')) {
            DB::table('packages')
                ->orderBy('id')
                ->lazy()
                ->each(function ($package) {
                    if (! $package->class_type_id) {
                        return;
                    }

                    $classTypeName = DB::table('class_types')
                        ->where('id', $package->class_type_id)
                        ->value('name');

                    if ($classTypeName) {
                        DB::table('packages')
                            ->where('id', $package->id)
                            ->update(['category_name' => $classTypeName]);
                    }
                });

            Schema::table('packages', function (Blueprint $table) {
                $table->dropConstrainedForeignId('class_type_id');
            });
        }
    }
};
