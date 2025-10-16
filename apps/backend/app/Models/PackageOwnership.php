<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Package;

class PackageOwnership extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'package_id',
        'credits_total',
        'credits_remaining',
        'status',
        'purchased_at',
        'expires_at',
    ];

    protected $casts = [
        'credits_total' => 'integer',
        'credits_remaining' => 'integer',
        'purchased_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }
}
