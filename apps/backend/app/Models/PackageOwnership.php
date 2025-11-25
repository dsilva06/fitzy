<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Package;
use App\Models\Concerns\HasStatus;

class PackageOwnership extends Model
{
    use HasFactory;
    use HasStatus;

    protected $fillable = [
        'user_id',
        'package_id',
        'credits_total',
        'credits_remaining',
        'status',
        'status_id',
        'purchased_at',
        'expires_at',
    ];

    protected $casts = [
        'credits_total' => 'integer',
        'credits_remaining' => 'integer',
        'purchased_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $appends = ['status'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

}
