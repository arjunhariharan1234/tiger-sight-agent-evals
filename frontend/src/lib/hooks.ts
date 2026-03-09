"use client";

import { useState, useEffect, useCallback } from "react";
import type { Filters } from "./api";

export function useFilters() {
  const [filters, setFilters] = useState<Filters>({});

  const updateFilter = useCallback((key: keyof Filters, value: string | number | undefined) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "" || value === null) {
        delete next[key];
      } else {
        (next as Record<string, unknown>)[key] = value;
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  return { filters, updateFilter, clearFilters, setFilters };
}

export function useFetch<T>(fetcher: (filters?: Filters) => Promise<T>, filters?: Filters) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher(filters)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetcher, filters]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
