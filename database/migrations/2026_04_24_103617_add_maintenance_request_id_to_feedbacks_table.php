<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            // Add the column if it doesn't exist
            if (!Schema::hasColumn('feedbacks', 'maintenance_request_id')) {
                $table->unsignedBigInteger('maintenance_request_id')->nullable()->after('user_id');
            }
        });

        // Copy existing data from request_id to maintenance_request_id if request_id exists
        if (Schema::hasColumn('feedbacks', 'request_id')) {
            DB::statement('UPDATE feedbacks SET maintenance_request_id = request_id');
        }
    }

    public function down()
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            if (Schema::hasColumn('feedbacks', 'maintenance_request_id')) {
                $table->dropColumn('maintenance_request_id');
            }
        });
    }
};