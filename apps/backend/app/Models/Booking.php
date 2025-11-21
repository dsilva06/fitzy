<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\ClassSession;
use App\Models\Payment;
use App\Models\Status;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'status',
        'status_id',
        'cancellation_deadline',
    ];

    protected $casts = [
        'cancellation_deadline' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function session()
    {
        return $this->belongsTo(ClassSession::class, 'session_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function statusDefinition()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }
}
