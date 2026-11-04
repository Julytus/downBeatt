import { useMemo } from "react";
import type { LutDTO } from "@/lib/types/lut";

/**
 * Video xem trước ở trang chi tiết (LUT có previewType = "video").
 * Tự phát không tiếng; người dùng bật "giảm chuyển động" thì không tự phát, bấm play trên thanh điều khiển.
 */
export function LutVideoPreview({ lut }: { lut: LutDTO }) {
  const autoPlay = useMemo(
    () => typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[12px] bg-black">
      <video
        src={lut.previewVideoUrl}
        poster={lut.coverUrl.replace("/640/360", "/1280/720")}
        aria-label={`${lut.title}: video xem trước sau khi áp LUT`}
        controls
        muted
        loop
        playsInline
        autoPlay={autoPlay}
        preload="metadata"
        className="size-full object-cover"
      />
      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
        Video xem trước
      </span>
    </div>
  );
}
