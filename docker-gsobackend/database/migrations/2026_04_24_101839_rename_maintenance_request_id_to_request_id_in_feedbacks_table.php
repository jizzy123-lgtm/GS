<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Skipped — maintenance_request_id column does not exist in feedbacks table
    }

    public function down()
    {
        // Nothing to rollback
    }
};