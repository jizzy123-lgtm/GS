<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            if (!Schema::hasColumn('feedbacks', 'client_type')) {
                $table->string('client_type')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'service_type')) {
                $table->string('service_type')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'request_date')) {
                $table->date('request_date')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sex')) {
                $table->string('sex')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'region')) {
                $table->string('region')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'age')) {
                $table->integer('age')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'office_visited')) {
                $table->string('office_visited')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'service_availed')) {
                $table->string('service_availed')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'cc1')) {
                $table->tinyInteger('cc1')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'cc2')) {
                $table->tinyInteger('cc2')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'cc3')) {
                $table->tinyInteger('cc3')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sqd0')) {
                $table->tinyInteger('sqd0')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sqd1')) {
                $table->tinyInteger('sqd1')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sqd2')) {
                $table->tinyInteger('sqd2')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sqd3')) {
                $table->tinyInteger('sqd3')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sqd4')) {
                $table->tinyInteger('sqd4')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sqd5')) {
                $table->tinyInteger('sqd5')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sqd6')) {
                $table->tinyInteger('sqd6')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sqd7')) {
                $table->tinyInteger('sqd7')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'sqd8')) {
                $table->tinyInteger('sqd8')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'suggestions')) {
                $table->text('suggestions')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'email')) {
                $table->string('email')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'feedback')) {
                $table->text('feedback')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'rating')) {
                $table->tinyInteger('rating')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'date')) {
                $table->date('date')->nullable();
            }
            if (!Schema::hasColumn('feedbacks', 'time')) {
                $table->time('time')->nullable();
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