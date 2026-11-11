import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { LutCard } from "@/components/shop/luts/lut-card";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { rememberImpression } from "@/lib/recommend/track";
import { useForYouDismissStore } from "@/lib/stores/for-you-dismiss";
import { useShopSession } from "@/lib/stores/shop-session";
import type { LutDTO } from "@/lib/types/lut";
import type { ForYouLutDTO, RecommendStrategy } from "@/lib/types/recommend";
import { cn } from "@/lib/utils";

interface ForYouItemProps {
  item: ForYouLutDTO;
  strategy: RecommendStrategy;
  impressionId?: number;
  onDownload: (lut: LutDTO) => void;
  onAddToCollection: (lut: LutDTO) => void;
  downloading?: boolean;
}

/**
 * Thẻ LUT trong khối gợi ý (plan §6.1 / §6.2 / §6.5).
 * Có đúng 3 phần tử con trực tiếp theo thứ tự:
 * 1. div (relative): chứa LutCard và lớp phủ "Đã ẩn khỏi gợi ý" + "Hoàn tác"
 * 2. p: tiêu đề LUT (link tới /luts/$slug)
 * 3. p: câu giải thích (không render khi strategy = POPULAR)
 */
export const ForYouItem = memo(function ForYouItem({
  item,
  strategy,
  impressionId,
  onDownload,
  onAddToCollection,
  downloading
}: ForYouItemProps) {
  const isHidden = useForYouDismissStore((s) => Boolean(s.hidden[item.id]));
  const hide = useForYouDismissStore((s) => s.hide);
  const undo = useForYouDismissStore((s) => s.undo);
  const user = useShopSession((s) => s.user);

  const handleOpen = () => {
    rememberImpression(item.id, impressionId);
  };

  const handleDismiss = () => {
    hide(item.id, impressionId);
  };

  const handleUndo = () => {
    undo(item.id);
  };

  return (
    <li className="flex w-[78%] shrink-0 snap-start flex-col gap-2 sm:w-[300px]">
      {/* 1. div chứa LutCard và lớp phủ */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[8px]">
        <div
          inert={isHidden}
          className={cn(
            "size-full transition-opacity duration-200 pointer-events-auto",
            isHidden && "opacity-40"
          )}
        >
          <LutCard
            lut={item}
            onDownload={onDownload}
            onAddToCollection={onAddToCollection}
            onDismiss={user ? handleDismiss : undefined}
            onOpen={handleOpen}
            downloading={downloading}
          />
        </div>
        {isHidden && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/40 p-4 text-center pointer-events-auto">
            <span className="text-xs font-semibold text-white">Đã ẩn khỏi gợi ý</span>
            <ShopButton variant="secondary" size="sm" onClick={handleUndo}>
              Hoàn tác
            </ShopButton>
          </div>
        )}
      </div>

      {/* 2. p tiêu đề */}
      <p inert={isHidden} className="truncate text-sm font-semibold">
        <Link
          to="/luts/$slug"
          params={{ slug: item.slug }}
          onClick={handleOpen}
          tabIndex={isHidden ? -1 : undefined}
          className={cn("hover:text-(--sh-primary) hover:underline", isHidden && "pointer-events-none")}
        >
          {item.title}
        </Link>
      </p>

      {/* 3. p câu giải thích (không render khi strategy = POPULAR) */}
      {strategy !== "POPULAR" && Boolean(item.reason) && (
        <p
          className={cn("truncate text-xs text-(--sh-muted)", isHidden && "invisible")}
          title={item.reason}
        >
          {item.reason}
        </p>
      )}
    </li>
  );
});
