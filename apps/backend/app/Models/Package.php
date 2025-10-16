<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Venue;
use App\Models\PackageOwnership;

class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'credits',
        'validity_months',
        'category_name',
        'venue_id',
    ];

    protected $casts = [
        'price' => 'float',
        'credits' => 'integer',
        'validity_months' => 'integer',
    ];

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function ownerships()
    {
        return $this->hasMany(PackageOwnership::class);
    }
}
