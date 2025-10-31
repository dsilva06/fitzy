<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Venue;
use App\Models\ClassSession;

class VenueInstructor extends Model
{
    use HasFactory;

    protected $fillable = [
        'venue_id',
        'name',
        'email',
        'avatar_url',
    ];

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function sessions()
    {
        return $this->hasMany(ClassSession::class, 'instructor_id');
    }
}
