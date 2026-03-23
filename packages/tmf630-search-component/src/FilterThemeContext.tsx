"use client";

import * as React from "react";
import type { FilterThemeConfig } from "./types.js";

const FilterThemeContext = React.createContext<FilterThemeConfig>({});

export interface FilterThemeProviderProps {
  config: FilterThemeConfig;
  children: React.ReactNode;
}

export function FilterThemeProvider({ config, children }: FilterThemeProviderProps) {
  return (
    <FilterThemeContext.Provider value={config}>
      {children}
    </FilterThemeContext.Provider>
  );
}

export function useFilterTheme(): FilterThemeConfig {
  return React.useContext(FilterThemeContext);
}
