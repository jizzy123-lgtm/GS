<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $columns = [
                'client_type'     => fn() => $table->string('client_type')->nullable(),
                'service_type'    => fn() => $table->string('service_type')->nullable(),
                'request_date'    => fn() => $table->date('request_date')->nullable(),
                'sex'             => fn() => $table->string('sex')->nullable(),
                'region'          => fn() => $table->string('region')->nullable(),
                'age'             => fn() => $table->integer('age')->nullable(),
                'office_visited'  => fn() => $table->string('office_visited')->nullable(),
                'service_availed' => fn() => $table->string('service_availed')->nullable(),
                'cc1'             => fn() => $table->integer('cc1')->nullable(),
                'cc2'             => fn() => $table->integer('cc2')->nullable(),
                'cc3'             => fn() => $table->integer('cc3')->nullable(),
                'sqd0'            => fn() => $table->integer('sqd0')->nullable(),
                'sqd1'            => fn() => $table->integer('sqd1')->nullable(),
                'sqd2'            => fn() => $table->integer('sqd2')->nullable(),
                'sqd3'            => fn() => $table->integer('sqd3')->nullable(),
                'sqd4'            => fn() => $table->integer('sqd4')->nullable(),
                'sqd5'            => fn() => $table->integer('sqd5')->nullable(),
                'sqd6'            => fn() => $table->integer('sqd6')->nullable(),
                'sqd7'            => fn() => $table->integer('sqd7')->nullable(),
                'sqd8'            => fn() => $table->integer('sqd8')->nullable(),
                'suggestions'     => fn() => $table->text('suggestions')->nullable(),
                'email'           => fn() => $table->string('email')->nullable(),
                'feedback'        => fn() => $table->text('feedback')->nullable(),
                'rating'          => fn() => $table->integer('rating')->nullable(),
                'date'            => fn() => $table->date('date')->nullable(),
                'time'            => fn() => $table->time('time')->nullable(),
            ];

            foreach ($columns as $column => $definition) {
                if (!Schema::hasColumn('feedbacks', $column)) {
                    $definition();
                }
            }
        });
    }

    public function down()
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropColumn([
                'client_type', 'service_type', 'request_date', 'sex', 'region',
                'age', 'office_visited', 'service_availed', 'cc1', 'cc2', 'cc3',
                'sqd0', 'sqd1', 'sqd2', 'sqd3', 'sqd4', 'sqd5', 'sqd6', 'sqd7',
                'sqd8', 'suggestions', 'email', 'feedback', 'rating', 'date', 'time'
            ]);
        });
    }
};
