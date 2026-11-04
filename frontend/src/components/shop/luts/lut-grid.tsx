import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLutDownload } from "@/hooks/use-lut-download";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { useShopSession } from "@/lib/stores/shop-session";
import type { LutDTO } from "@/lib/types/lut";
import { cn } from "@/lib/utils";
import { LutCard } from "./lut-card";

const GRID_CLASS = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

export function LutGridSkeleton({ count = 8, label = "Đang tải danh sách LUT" }: { count?: number; label?: string }) {
  return (
    <div className={GRID_CLASS} aria-busy="true" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="aspect-video w-full rounded-[8px] bg-(--sh-surface)" />
      ))}
    </div>
  );
}

interface LutGridProps {
  items: LutDTO[];
  isLoading: boolean;
  isError: boolean;
  /** Đang tải lại do đổi bộ lọc (vẫn hiện dữ liệu cũ, làm mờ) */
  isRefetching?: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onClearFilters?: () => void;
  label?: string;
}

/**
 * Lưới LUT + các trạng thái tải / lỗi / rỗng.
 * Trang đầu có nút "Xem thêm"; bấm một lần thì chuyển sang tự tải khi cuộn gần cuối (như cuộn vô hạn).
 */
export function LutGrid({
  items,
  isLoading,
  isError,
  isRefetching = false,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onRetry,
  onClearFilters,
  label = "Danh sách LUT"
}: LutGridProps) {
  const { download, pendingId } = useLutDownload();
  const openDialog = useShopDialog((s) => s.open);
  const [autoLoad, setAutoLoad] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const addToCollection = useCallback(
    (lut: LutDTO) => {
      if (!useShopSession.getState().user) return openDialog({ type: "register", lut });
      /* chỗ giữ chỗ tới lát `bo-suu-tap` */ toast.info("Bộ sưu tập sẽ có ở bản sau", { description: lut.title });
    },
    [openDialog]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!autoLoad || !hasNextPage || isFetchingNextPage || !el) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && onLoadMore(), {
      rootMargin: "400px 0px"
    });
    io.observe(el);
    return () => io.disconnect();
  }, [autoLoad, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) return <LutGridSkeleton />;

  if (isError) {
    return (
      <EmptyState title="Không tải được danh sách LUT" description="Kiểm tra kết nối rồi thử lại.">
        <ShopButton variant="secondary" size="sm" onClick={onRetry}>
          Thử lại
        </ShopButton>
      </EmptyState>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState title="Không tìm thấy LUT phù hợp" description="Thử từ khoá khác hoặc bỏ bớt bộ lọc.">
        {onClearFilters && (
          <ShopButton variant="secondary" size="sm" onClick={onClearFilters}>
            Xoá bộ lọc
          </ShopButton>
        )}
      </EmptyState>
    );
  }

  return (
    <>
      <ul
        aria-label={label}
        aria-busy={isRefetching || isFetchingNextPage}
        className={cn(GRID_CLASS, "transition-opacity", isRefetching && "opacity-60")}
      >
        {items.map((lut) => (
          <li key={lut.id}>
            <LutCard
              lut={lut}
              onDownload={download}
              onAddToCollection={addToCollection}
              downloading={pendingId === lut.id}
            />
          </li>
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 4 }, (_, i) => (
            <li key={`sk-${i}`} aria-hidden>
              <Skeleton className="aspect-video w-full rounded-[8px] bg-(--sh-surface)" />
            </li>
          ))}
      </ul>

      {hasNextPage && !autoLoad && (
        <div className="mt-10">
          <ShopButton
            variant="secondary"
            onClick={() => {
              setAutoLoad(true);
              onLoadMore();
            }}
            disabled={isFetchingNextPage}
            className="w-full"
          >
            {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
            Xem thêm
          </ShopButton>
        </div>
      )}
      {autoLoad && hasNextPage && (
        <div ref={sentinelRef} className="mt-10 flex h-10 justify-center" role="status" aria-live="polite">
          {isFetchingNextPage && (
            <>
              <Loader2 className="size-7 animate-spin text-(--sh-muted)" aria-hidden />
              <span className="sr-only">Đang tải thêm LUT</span>
            </>
          )}
        </div>
      )}
    </>
  );
}

function EmptyState({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[12px] border border-dashed border-(--sh-border) p-12 text-center">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-(--sh-muted)">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
