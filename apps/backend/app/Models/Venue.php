<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ClassSession;
use App\Models\Package;
use App\Models\Favorite;

class Venue extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'neighborhood',
        'city',
        'address',
        'rating',
        'logo_url',
        'description',
    ];

    protected $casts = [
        'rating' => 'float',
    ];

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
}
