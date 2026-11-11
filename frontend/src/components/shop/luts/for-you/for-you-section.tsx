import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLutDownload } from "@/hooks/use-lut-download";
import { useSaveToCollection } from "@/hooks/use-save-to-collection";
import { useViewerKey } from "@/hooks/use-viewer-key";
import { useForYouDismissStore } from "@/lib/stores/for-you-dismiss";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { useShopSession } from "@/lib/stores/shop-session";
import { createForYouQueryOptions } from "@/lib/tanstack/options/recommend";
import { ForYouItem } from "./for-you-item";

const SUBTITLES = {
  PROFILE: "Dựa trên các LUT bạn đã tải và xem gần đây",
  PREFERENCE: "Dựa trên sở thích màu bạn đã chọn",
  POPULAR: "Được tải nhiều gần đây, đủ các phong cách màu"
} as const;

/**
 * Khối gợi ý 12 LUT ở đầu trang /luts (plan §6.1 / §6.2 / §6.5).
 */
export function ForYouSection() {
  const { key: viewerKey, ready } = useViewerKey();
  const user = useShopSession((s) => s.user);
  const openDialog = useShopDialog((s) => s.open);
  const { download, pendingId } = useLutDownload();
  const { open: openSaveToCollection } = useSaveToCollection();
  const removed = useForYouDismissStore((s) => s.removed);

  const query = useQuery({
    ...createForYouQueryOptions(viewerKey),
    enabled: ready
  });

  const listRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const items = useMemo(
    () => (query.data?.items ?? []).filter((item) => !removed[item.id]),
    [query.data?.items, removed]
  );

  const updateScrollButtons = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, items.length]);

  const scrollPrev = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
  };

  const scrollNext = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
  };

  // Đang tải hoặc phiên chưa sẵn sàng: hiện Skeleton
  if (!ready || query.isPending) {
    return (
      <section aria-busy="true" aria-label="Đang tải gợi ý" className="mb-10 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48 rounded-[6px] bg-(--sh-surface)" />
        </div>
        <ul className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="w-[78%] shrink-0 sm:w-[300px]">
              <Skeleton className="aspect-video w-full rounded-[8px] bg-(--sh-surface)" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Lỗi hoặc rỗng: không render gì (không toast, không chỗ trống)
  if (query.isError || !query.data || items.length === 0) {
    return null;
  }

  const isPopular = query.data.strategy === "POPULAR";
  const title = isPopular ? "Phổ biến tuần này" : "Dành cho bạn";
  const subtitle = SUBTITLES[query.data.strategy] ?? SUBTITLES.POPULAR;

  return (
    <section aria-labelledby="for-you-heading" className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="for-you-heading" className="text-xl font-bold tracking-tight text-(--sh-fg)">
            {title}
          </h2>
          <p className="mt-1 text-xs text-(--sh-muted)">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <ShopButton
              variant="ghost"
              size="sm"
              onClick={() => openDialog({ type: "preference", mode: "edit" })}
              className="text-xs text-(--sh-muted) hover:text-(--sh-fg)"
            >
              Sửa sở thích màu
              <ChevronRight className="size-3.5" aria-hidden />
            </ShopButton>
          )}
          <div className="hidden sm:flex sm:items-center sm:gap-1">
            <ShopButton
              variant="ghost"
              size="icon-sm"
              aria-label="LUT trước"
              disabled={!canScrollLeft}
              onClick={scrollPrev}
            >
              <ChevronLeft className="size-4" />
            </ShopButton>
            <ShopButton
              variant="ghost"
              size="icon-sm"
              aria-label="LUT tiếp theo"
              disabled={!canScrollRight}
              onClick={scrollNext}
            >
              <ChevronRight className="size-4" />
            </ShopButton>
          </div>
        </div>
      </div>

      <ul
        ref={listRef}
        aria-label="Gợi ý LUT"
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <ForYouItem
            key={item.id}
            item={item}
            strategy={query.data.strategy}
            impressionId={query.data.impressionId}
            onDownload={download}
            onAddToCollection={openSaveToCollection}
            downloading={pendingId === item.id}
          />
        ))}
      </ul>
    </section>
  );
}
