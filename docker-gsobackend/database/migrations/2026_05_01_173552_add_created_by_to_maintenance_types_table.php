<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('maintenance_types', function (Blueprint $table) {
            $table->unsignedBigInteger('created_by')->nullable(); // nullable so existing types stay as global
        });
    }

    public function down()
    {
        Schema::table('maintenance_types', function (Blueprint $table) {
            $table->dropColumn('created_by');
        });
    }
};
