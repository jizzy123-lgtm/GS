<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transportation_requests', function (Blueprint $table) {
            $table->id();
            $table->string('driver_name');
            $table->string('contact_number');
            $table->string('purpose');
            $table->string('destination');
            $table->time('departure_time');
            $table->time('arrival_time');
            $table->date('departure_date');
            $table->date('arrival_date');
            $table->string('requested_by');
            $table->string('control_no')->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transportation_requests');
    }
};
