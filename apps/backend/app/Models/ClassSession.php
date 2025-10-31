<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Venue;
use App\Models\ClassType;
use App\Models\Booking;
use App\Models\WaitlistEntry;
use App\Models\VenueInstructor;

class ClassSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'venue_id',
        'class_type_id',
        'instructor_id',
        'name',
        'description',
        'coach_name',
        'start_datetime',
        'end_datetime',
        'capacity_total',
        'capacity_taken',
        'price',
        'credit_cost',
        'level',
    ];

    protected $casts = [
        'start_datetime' => 'datetime',
        'end_datetime' => 'datetime',
        'capacity_total' => 'integer',
        'capacity_taken' => 'integer',
        'price' => 'float',
        'credit_cost' => 'integer',
    ];

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function classType()
    {
        return $this->belongsTo(ClassType::class);
    }

    public function instructor()
    {
        return $this->belongsTo(VenueInstructor::class, 'instructor_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'session_id');
    }

    public function waitlistEntries()
    {
        return $this->hasMany(WaitlistEntry::class, 'session_id');
    }
}
