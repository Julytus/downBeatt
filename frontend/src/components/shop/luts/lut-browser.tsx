import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { hasActiveFilters, toLutListFilter, type LutsSearch } from "@/lib/search/luts";
import { createInfiniteLutsQueryOptions } from "@/lib/tanstack/options/luts";
import { LutGrid } from "./lut-grid";
import { LutsToolbar, type LutsToolbarValue } from "./toolbar/luts-toolbar";

/** Giá trị thanh lọc → tham số URL (bỏ giá trị mặc định cho URL gọn). */
export const toLutsSearch = (v: LutsToolbarValue): LutsSearch => ({
  q: v.q || undefined,
  kw: v.keywords.length ? v.keywords : undefined,
  style: v.styles.length ? v.styles : undefined,
  sort: v.sort === "relevance" ? undefined : v.sort
});

interface LutBrowserProps {
  search: LutsSearch;
  onSearchChange: (search: LutsSearch) => void;
  /** Lọc cố định (trang danh mục) */
  category?: string;
  /** Nhãn cho trình đọc màn hình của lưới */
  label?: string;
}

/** Thanh lọc + lưới LUT theo tham số URL. Dùng ở /luts và /luts/danh-muc/<slug>. */
export function LutBrowser({ search, onSearchChange, category, label }: LutBrowserProps) {
  const filter = useMemo(() => ({ ...toLutListFilter(search), category }), [search, category]);
  const toolbarValue: LutsToolbarValue = useMemo(
    () => ({
      q: filter.q,
      keywords: filter.keywords ?? [],
      styles: filter.styles ?? [],
      sort: filter.sort ?? "relevance"
    }),
    [filter]
  );

  const query = useInfiniteQuery(createInfiniteLutsQueryOptions(filter));
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const { fetchNextPage, refetch } = query;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);

  const updateFilter = useCallback(
    (patch: Partial<LutsToolbarValue>) => onSearchChange(toLutsSearch({ ...toolbarValue, ...patch })),
    [onSearchChange, toolbarValue]
  );

  return (
    <>
      <LutsToolbar value={toolbarValue} onChange={updateFilter} />
      <div className="mt-11">
        <LutGrid
          label={label}
          items={items}
          isLoading={query.isPending}
          isError={query.isError}
          isRefetching={query.isPlaceholderData && query.isFetching}
          hasNextPage={query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
          onLoadMore={loadMore}
          onRetry={() => void refetch()}
          onClearFilters={hasActiveFilters(search) ? () => onSearchChange({}) : undefined}
        />
      </div>
    </>
  );
}
