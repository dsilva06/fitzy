<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Status;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

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

    protected function applyStatusFilter(Builder $query, Request $request, string $modelClass, string $parameter = 'status'): Builder
    {
        $values = [];

        if ($request->filled($parameter)) {
            $values = array_merge($values, Arr::wrap($request->query($parameter)));
        }

        $filter = $request->query('filter');

        if (is_array($filter) && array_key_exists($parameter, $filter)) {
            $values = array_merge($values, Arr::wrap($filter[$parameter]));
        }

        $values = array_values(array_filter(array_unique($values)));

        if (empty($values)) {
            return $query;
        }

        $statusIds = array_values(array_filter(array_map(
            fn ($value) => Status::idFor($modelClass, $value),
            $values
        )));

        if (! empty($statusIds)) {
            $query->whereIn('status_id', $statusIds);
        }

        return $query;
    }
}
