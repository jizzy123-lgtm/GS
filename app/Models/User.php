<?php

namespace App\Models;

use App\Models\Role;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'full_name', 'username', 'email', 'position',
        'office', 'contact_number', 'password', 'role_id'
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id'); // Make sure it's role_id
    }

    public function isRole($roleName)
    {
        return optional($this->role)->role_name === $roleName;

    }
}


