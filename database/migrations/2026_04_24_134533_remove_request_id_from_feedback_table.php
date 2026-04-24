<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropForeign(['request_id']); // remove FK first
            $table->dropColumn('request_id');
        });
    }

    public function down(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->unsignedBigInteger('request_id')->nullable();
        });
    }
};