<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceRequest extends Model
{
    use HasFactory;
    protected $fillable = [
        'date_requested', 'details', 'requesting_personnel',
        'position', 'requesting_office', 'contact_number',
        'status', 'date_received', 'time_received',
        'priority_number', 'remarks', 'verified_by',
        'approved_by_1', 'approved_by_2', 'maintenance_type_id'
    ];
}


    // // Relationship with User (Requester)
    // public function requester()
    // {
    //     return $this->belongsTo(User::class, 'requesting_personnel', 'id');
    // }

    // // Relationship with User (Verified By)
    // public function verifier()
    // {
    //     return $this->belongsTo(User::class, 'verified_by');
    // }

    // // Relationship with Approvers
    // public function approver1()
    // {
    //     return $this->belongsTo(User::class, 'approved_by_1');
    // }

    // public function approver2()
    // {
    //     return $this->belongsTo(User::class, 'approved_by_2');
    // }

