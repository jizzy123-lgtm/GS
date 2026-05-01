<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCommentsTable extends Migration
{
    public function up()
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id(); // auto-incrementing primary key
            $table->text('comment')->nullable();  // Text field for the actual comment
            $table->unsignedBigInteger('request_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('role_id');
            $table->date('date');
            $table->time('time');

            $table->timestamps(); // created_at and updated_at timestamps

            // Add foreign key constraints (optional, depending on your relationship)
            $table->foreign('request_id')->references('id')->on('maintenance_requests')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('comments');
    }
}
