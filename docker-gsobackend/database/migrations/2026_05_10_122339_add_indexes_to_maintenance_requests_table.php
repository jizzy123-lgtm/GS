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
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->index('status_id');
            $table->index('requesting_personnel');
            $table->index('maintenance_type_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->dropIndex(['status_id']);
            $table->dropIndex(['requesting_personnel']);
            $table->dropIndex(['maintenance_type_id']);
            $table->dropIndex(['created_at']);
        });
    }
};
