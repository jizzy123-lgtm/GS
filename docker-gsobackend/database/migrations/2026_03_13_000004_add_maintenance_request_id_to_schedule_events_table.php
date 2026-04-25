<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedule_events', function (Blueprint $table) {
            $table->foreignId('maintenance_request_id')
                ->nullable()
                ->unique()
                ->constrained('maintenance_requests')
                ->nullOnDelete()
                ->after('created_by');
        });
    }

    public function down(): void
    {
        Schema::table('schedule_events', function (Blueprint $table) {
            $table->dropForeign(['maintenance_request_id']);
            $table->dropColumn('maintenance_request_id');
        });
    }
};
