<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleEvent extends Model
{
    protected $fillable = [
        'title',
        'date',
        'time',
        'location',
        'notes',
        'assigned_office_id',
        'created_by',
        'maintenance_request_id',
    ];

    public function office()
    {
        return $this->belongsTo(Office::class, 'assigned_office_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function maintenanceRequest()
    {
        return $this->belongsTo(MaintenanceRequest::class, 'maintenance_request_id');
    }
}
