<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceRequest extends Model
{
    use HasFactory;
    protected $fillable = [
        'date_requested',
        'details',
        'requesting_personnel', // will become a user_id (foreign key)
        'position_id',
        'requesting_office_id',
        'contact_number',
        'status_id',
        'date_received',
        'time_received',
        'priority_number', // now a string
        'remarks',
        'verified_by',
        'approved_by_1',
        'approved_by_2',
        'maintenance_type_id',
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requesting_personnel');
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function office()
    {
        return $this->belongsTo(Office::class, 'requesting_office_id');
    }

    public function status()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function approver1()
    {
        return $this->belongsTo(User::class, 'approved_by_1');
    }

    public function approver2()
    {
        return $this->belongsTo(User::class, 'approved_by_2');
    }

    public function maintenanceType()
    {
        return $this->belongsTo(MaintenanceType::class);
    }

}

