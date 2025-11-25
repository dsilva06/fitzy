<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Venue;
use App\Models\PackageOwnership;
use App\Models\ClassType;

class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'credits',
        'validity_months',
        'venue_id',
        'class_type_id',
    ];

    protected $casts = [
        'price' => 'float',
        'credits' => 'integer',
        'validity_months' => 'integer',
    ];

    protected $appends = ['category_name'];

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function ownerships()
    {
        return $this->hasMany(PackageOwnership::class);
    }

    public function classType()
    {
        return $this->belongsTo(ClassType::class);
    }

    public function getCategoryNameAttribute(): ?string
    {
        return $this->classType?->name;
    }
}
