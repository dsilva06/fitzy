<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\ClassSession;
use App\Models\Concerns\HasStatus;

class WaitlistEntry extends Model
{
    use HasFactory;
    use HasStatus;

    protected $fillable = [
        'user_id',
        'session_id',
        'status',
        'status_id',
    ];

    protected $appends = ['status'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function session()
    {
        return $this->belongsTo(ClassSession::class, 'session_id');
    }

}
