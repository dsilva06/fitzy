<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait InteractsWithQueryParameters
{
    protected function applyFilters(Builder $query, Request $request, array $allowed = []): Builder
    {
        $filters = array_filter($request->query(), static fn ($key) => ! in_array($key, ['order_by', 'direction', 'limit', 'page'], true), ARRAY_FILTER_USE_KEY);

        if ($request->has('filter') && is_array($request->query('filter'))) {
            $filters = array_merge($filters, $request->query('filter'));
        }

        foreach ($filters as $field => $value) {
            if (! empty($allowed) && ! in_array($field, $allowed, true)) {
                continue;
            }

            if (is_array($value)) {
                $query->whereIn($field, $value);
            } else {
                $query->where($field, $value);
            }
        }

        return $query;
    }

    protected function applySorting(Builder $query, Request $request, array $allowed = [], string $default = 'id'): Builder
    {
        $field = $request->query('order_by', $default);
        $direction = strtolower($request->query('direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        if (! empty($allowed) && ! in_array($field, $allowed, true)) {
            $field = $default;
        }

        return $query->orderBy($field, $direction);
    }

    protected function applyLimit(Builder $query, Request $request): Builder
    {
        if ($request->filled('limit')) {
            $limit = max(1, (int) $request->query('limit'));
            $query->limit($limit);
        }

        return $query;
    }
}
