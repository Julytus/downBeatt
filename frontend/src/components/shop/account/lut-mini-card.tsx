import { Star } from "lucide-react";
import type { LutDTO } from "@/lib/types/lut";

/** Thẻ LUT nhỏ ở đầu hộp thoại (đang muốn tải LUT nào) */
export function LutMiniCard({ lut }: { lut: LutDTO }) {
  return (
    <div className="flex items-center gap-3 rounded-[8px] bg-(--sh-surface) p-2 pr-3">
      <img
        src={lut.coverUrl}
        alt=""
        className="aspect-video w-20 shrink-0 rounded-[6px] object-cover"
        style={{ filter: lut.previewFilter }}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{lut.title}</p>
        <p className="truncate text-xs text-(--sh-muted)">{lut.creator}</p>
      </div>
      {lut.premium && (
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-(--sh-active-bg) px-2 py-0.5 text-xs font-semibold text-(--sh-active-fg)">
          <Star className="size-3 fill-current" aria-hidden />
          Premium
        </span>
      )}
    </div>
  );
}
