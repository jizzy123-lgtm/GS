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
            $table->foreignId('requesting_personnel')->constrained('users');
            $table->foreignId('position_id')->constrained('positions');
            $table->foreignId('requesting_office')->constrained('offices');
            $table->string('contact_number');
            $table->foreignId('status_id')->constrained('statuses');
            $table->date('date_received')->nullable();
            $table->time('time_received')->nullable();
            $table->string('priority_number')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->foreignId('approved_by_1')->nullable()->constrained('users');
            $table->foreignId('approved_by_2')->nullable()->constrained('users');
            $table->foreignId('maintenance_type_id')->constrained('maintenance_types')->onDelete('cascade');
            $table->date('scheduled_date')->nullable();
            $table->time('scheduled_time')->nullable();
            $table->unsignedBigInteger('assigned_staff_id')->nullable();
            $table->foreign('assigned_staff_id')->references('id')->on('users');
            
            $table->boolean('schedule_confirmed')->default(false);
            $table->string('schedule_status')->default('none');
            $table->date('requester_proposed_date')->nullable();
            $table->time('requester_proposed_time')->nullable();
            $table->text('requester_schedule_note')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('maintenance_requests');
    }
};