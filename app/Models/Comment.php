<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id',
        'user_id',
        'role_id',
        'date',
        'time',
        'comment',  // Add this here
    ];

    // Define the relationship with the Request model
    public function request()
    {
        return $this->belongsTo(Request::class);
    }

    // Define the relationship with the User model
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Define the relationship with the Role model
    // public function role()
    // {
    //     return $this->belongsTo(Role::class);
    // }

    public function maintenanceRequest()
    {
        return $this->belongsTo(MaintenanceRequest::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }


}
