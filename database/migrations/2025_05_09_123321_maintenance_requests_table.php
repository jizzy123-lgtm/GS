<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('maintenance_requests', function (Blueprint $table) {
            $table->id();

            $table->date('date_requested');
            $table->text('details');

            // Foreign keys instead of raw strings
            $table->foreignId('requesting_personnel')->constrained('users')->onDelete('cascade');
            $table->foreignId('position_id')->constrained('positions')->onDelete('cascade');
            $table->foreignId('requesting_office')->constrained('offices')->onDelete('cascade');
            $table->foreignId('status_id')->default(1)->constrained('statuses')->onDelete('cascade'); // Assuming default status is Pending with ID 1

            $table->string('contact_number');

            $table->date('date_received')->nullable();
            $table->time('time_received')->nullable();
            $table->string('priority_number')->nullable();
            $table->text('remarks')->nullable();

            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by_1')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by_2')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('maintenance_type_id')->constrained('maintenance_types')->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('maintenance_requests');
    }
};

