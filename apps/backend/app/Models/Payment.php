<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Booking;
use App\Models\Concerns\HasStatus;

class Payment extends Model
{
    use HasFactory;
    use HasStatus;

    protected $fillable = [
        'booking_id',
        'method',
        'amount',
        'status',
        'status_id',
        'meta',
    ];

    protected $casts = [
        'amount' => 'float',
        'meta' => 'array',
    ];

    protected $appends = ['status'];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

}
