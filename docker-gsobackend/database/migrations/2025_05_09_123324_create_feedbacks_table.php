<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maintenance_request_id')->constrained('maintenance_requests')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('client_type');
            $table->string('service_type');
            $table->date('request_date');
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
            $table->text('feedback')->nullable();
            $table->tinyInteger('rating')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('feedbacks');
    }
};