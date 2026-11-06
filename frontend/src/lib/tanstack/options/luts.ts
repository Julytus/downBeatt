import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  getLut,
  getLutCategories,
  getLutCategory,
  getLuts,
  getLutSuggestions,
  getRelatedLuts
} from "@/lib/axios/luts";
import type { LutListFilter, LutListResponseDTO } from "@/lib/types/lut";

export const LUTS_PAGE_SIZE = 12;

const nextPage = (last: LutListResponseDTO) =>
  last.page * LUTS_PAGE_SIZE < last.total ? last.page + 1 : undefined;

export const createInfiniteLutsQueryOptions = (filter: LutListFilter) =>
  infiniteQueryOptions({
    queryKey: ["luts", "list", filter],
    queryFn: ({ pageParam }) =>
      getLuts({ ...filter, paging: { page: pageParam, limit: LUTS_PAGE_SIZE } }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData
  });

export const createLutQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["luts", "detail", slug],
    queryFn: () => getLut(slug),
    staleTime: 60_000
  });

export const createInfiniteRelatedLutsQueryOptions = (slug: string) =>
  infiniteQueryOptions({
    queryKey: ["luts", "related", slug],
    queryFn: ({ pageParam }) =>
      getRelatedLuts(slug, { page: pageParam, limit: LUTS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage
  });

export const createLutSuggestionsQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ["luts", "suggest", q],
    queryFn: () => getLutSuggestions(q),
    staleTime: 60_000,
    placeholderData: keepPreviousData
  });

export const lutCategoriesQueryOptions = queryOptions({
  queryKey: ["luts", "categories"],
  queryFn: getLutCategories,
  staleTime: Infinity
});

export const createLutCategoryQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["luts", "categories", slug],
    queryFn: () => getLutCategory(slug),
    staleTime: Infinity
  });


export const homeFeaturedLutsQueryOptions = queryOptions({
  queryKey: ["luts", "home-featured"],
  queryFn: () => getLuts({ sort: "popular", paging: { page: 1, limit: 12 } }),
  staleTime: 60_000
});
