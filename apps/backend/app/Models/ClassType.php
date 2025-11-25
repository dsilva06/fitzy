<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ClassSession;
use App\Models\Package;

class ClassType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
    ];

    public function sessions()
    {
        return $this->hasMany(ClassSession::class);
    }

    public function packages()
    {
        return $this->hasMany(Package::class);
    }
}
