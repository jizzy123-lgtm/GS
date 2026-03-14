<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransportationRequest extends Model
{
    //
    use HasFactory;

    protected $fillable = [
        'request_id',
        'driver_name',
        'contact_number',
        'purpose',
        'destination',
        'departure_time',
        'arrival_time',
        'departure_date',
        'arrival_date',
        'requested_by',
        'control_no',
    ];
}
