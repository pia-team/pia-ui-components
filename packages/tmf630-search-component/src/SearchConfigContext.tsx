"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SearchConfig, SearchContextConfig, SearchableField } from "@pia-team/pia-ui-tmf630-query-core";
import { parseSearchConfig, getContext, configToFilterableFields } from "@pia-team/pia-ui-tmf630-query-core";

interface SearchConfigContextValue {
  config: SearchConfig | null;
  loading: boolean;
  error: string | null;
}

const SearchConfigCtx = createContext<SearchConfigContextValue>({
  config: null,
  loading: true,
  error: null,
});

interface SearchConfigProviderProps {
  url?: string;
  config?: SearchConfig;
  children: ReactNode;
}

export function SearchConfigProvider({ url, config: directConfig, children }: SearchConfigProviderProps) {
  const [config, setConfig] = useState<SearchConfig | null>(directConfig ?? null);
  const [loading, setLoading] = useState(!directConfig);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (directConfig || !url) return;
    let cancelled = false;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        try {
          setConfig(parseSearchConfig(json));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to parse search config");
        }
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to fetch search config");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [url, directConfig]);

  const value = useMemo(() => ({ config, loading, error }), [config, loading, error]);

  return <SearchConfigCtx.Provider value={value}>{children}</SearchConfigCtx.Provider>;
}

export function useSearchConfig(contextId?: string): SearchContextConfig | null {
  const { config } = useContext(SearchConfigCtx);
  if (!config) return null;
  try {
    return getContext(config, contextId);
  } catch {
    return null;
  }
}

export function useSearchFields(
  contextId?: string,
  i18nMap?: Record<string, string>,
): SearchableField[] {
  const ctx = useSearchConfig(contextId);
  return useMemo(() => {
    if (!ctx) return [];
    return configToFilterableFields(ctx, i18nMap);
  }, [ctx, i18nMap]);
}
