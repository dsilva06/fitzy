<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('statuses', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->string('model_binding');
            $table->string('icon', 100)->nullable()->comment('Optional icon to represent this status');
            $table->char('color', 30)->nullable()->comment('Hex or Tailwind color helper');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('statuses');
    }
};
