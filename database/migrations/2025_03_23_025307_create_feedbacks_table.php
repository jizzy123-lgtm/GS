<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('maintenance_request_id');

            $table->string('client_type'); // Citizen, Business, Gov
            $table->string('service_type'); // Internal or External
            $table->date('date');

            $table->string('sex');
            $table->string('region')->nullable();
            $table->integer('age');
            $table->string('office_visited');
            $table->string('service_availed');

            $table->integer('cc1');
            $table->integer('cc2')->nullable();
            $table->integer('cc3')->nullable();

            $table->integer('sqd0');
            $table->integer('sqd1');
            $table->integer('sqd2');
            $table->integer('sqd3');
            $table->integer('sqd4');
            $table->integer('sqd5');
            $table->integer('sqd6');
            $table->integer('sqd7');
            $table->integer('sqd8');

            $table->text('suggestions')->nullable();
            $table->string('email')->nullable();

            $table->timestamps();


            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('maintenance_request_id')->references('id')->on('maintenance_requests')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
