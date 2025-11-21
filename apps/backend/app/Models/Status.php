<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    use HasFactory;

    protected $fillable = [
        'description',
        'model_binding',
        'icon',
        'color',
    ];

    protected static array $idCache = [];

    public static function idFor(string $modelClass, string $value): ?int
    {
        $key = $modelClass . '|' . $value;

        if (! array_key_exists($key, static::$idCache)) {
            static::$idCache[$key] = static::query()
                ->where('model_binding', $modelClass)
                ->where('description', $value)
                ->value('id');
        }

        return static::$idCache[$key];
    }
}
