<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ClassSession;
use App\Models\Package;
use App\Models\Favorite;
use App\Models\User;
use App\Models\Concerns\HasStatus;

class Venue extends Model
{
    use HasFactory;
    use HasStatus;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'rif',
        'neighborhood',
        'city',
        'address',
        'rating',
        'logo_url',
        'description',
        'status',
        'status_id',
        'status_note',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'rating' => 'float',
        'approved_at' => 'datetime',
    ];

    protected $appends = ['status'];

    public function sessions()
    {
        return $this->hasMany(ClassSession::class);
    }

    public function packages()
    {
        return $this->hasMany(Package::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function venueAdmins()
    {
        return $this->hasMany(User::class)->where('role', 'venue_admin');
    }

}
