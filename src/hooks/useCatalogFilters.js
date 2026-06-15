import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  buildCatalogApiParams,
  buildCatalogFacetParams,
  countActiveFilters,
  hasAnyCatalogFilter,
  hasPriceFilter,
  parseCatalogParams,
} from '../lib/catalog-filters.js';

export const CATALOG_PAGE_SIZE = 24;

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseCatalogParams(searchParams), [searchParams]);

  const patchParams = useCallback(
    (patch, { resetPage = true } = {}) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === '' || value === 0) next.delete(key);
        else next.set(key, String(value));
      }
      if (resetPage) next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const setSearch = useCallback(
    (q) => patchParams({ q: q.trim() || null }),
    [patchParams],
  );

  const setSeries = useCallback(
    (series) => {
      patchParams({
        series: series || null,
        sub: null,
        mat: null,
        color: null,
      });
    },
    [patchParams],
  );

  const setSort = useCallback(
    (sort) => patchParams({ sort: sort || 'newest' }),
    [patchParams],
  );

  const setPage = useCallback(
    (page) => patchParams({ page: page > 1 ? page : null }, { resetPage: false }),
    [patchParams],
  );

  const applySheetFilters = useCallback(
    ({ series, sub, mat, color, min, max }) => {
      patchParams({
        series: series || null,
        sub: sub || null,
        mat: mat || null,
        color: color || null,
        min: min > 0 ? min : null,
        max: max > 0 ? max : null,
      });
    },
    [patchParams],
  );

  const clearAllFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (filters.q) next.set('q', filters.q);
    setSearchParams(next);
  }, [filters.q, setSearchParams]);

  const clearSheetFilters = useCallback(() => {
    patchParams({
      series: null,
      sub: null,
      mat: null,
      color: null,
      min: null,
      max: null,
    });
  }, [patchParams]);

  const apiParams = useMemo(
    () => buildCatalogApiParams(filters, { pageSize: CATALOG_PAGE_SIZE }),
    [filters],
  );

  const facetApiParams = useMemo(
    () => buildCatalogFacetParams(filters),
    [filters],
  );

  return {
    filters,
    apiParams,
    facetApiParams,
    filterBadgeCount: countActiveFilters(filters),
    hasPriceFilter: hasPriceFilter(filters),
    hasAnyFilter: hasAnyCatalogFilter(filters),
    setSearch,
    setSeries,
    setSort,
    setPage,
    applySheetFilters,
    clearAllFilters,
    clearSheetFilters,
  };
}
