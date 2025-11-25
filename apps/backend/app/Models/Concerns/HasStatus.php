<?php

namespace App\Models\Concerns;

use App\Models\Status;

trait HasStatus
{
    public function statusDefinition()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    public function getStatusAttribute(): ?string
    {
        return $this->statusDefinition?->description;
    }

    public function setStatusAttribute(?string $value): void
    {
        if ($value === null || $value === '') {
            $this->attributes['status_id'] = null;
            return;
        }

        $this->attributes['status_id'] = Status::idFor(static::class, $value);
    }
}
