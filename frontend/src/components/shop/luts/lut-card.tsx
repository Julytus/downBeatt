import { Link } from "@tanstack/react-router";
import { CirclePlus, Download, Loader2, Play, Star } from "lucide-react";
import { memo, useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LutDTO } from "@/lib/types/lut";
import { cn } from "@/lib/utils";
import { BeforeAfter, useSplitPosition } from "./before-after";

export interface LutCoverProps {
  coverUrl: string;
  title?: string;
  size?: "sm" | "md";
  className?: string;
}

export function LutCover({
  coverUrl,
  title = "",
  className
}: LutCoverProps) {
  return (
    <div className={cn("relative size-full overflow-hidden bg-(--sh-surface)", className)}>
      <img
        src={coverUrl}
        alt={title}
        className="size-full object-cover"
        loading="lazy"
        width={320}
        height={180}
      />
    </div>
  );
}

interface LutCardProps {
  lut: LutDTO;
  onDownload?: (lut: LutDTO) => void;
  onAddToCollection?: (lut: LutDTO) => void;
  /** Đang xin link tải LUT này */
  downloading?: boolean;
}

export const LutCard = memo(function LutCard({
  lut,
  onDownload,
  onAddToCollection,
  downloading = false
}: LutCardProps) {
  const isVideo = lut.previewType === "video" && !!lut.previewVideoUrl;
  const split = useSplitPosition(100);
  const [playing, setPlaying] = useState(false);
  const pointer = isVideo
    ? {
        onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && setPlaying(true),
        onPointerLeave: () => setPlaying(false)
      }
    : split.bind;

  return (
    <article
      {...pointer}
      className="group relative aspect-video w-full overflow-hidden rounded-[8px] bg-(--sh-surface)"
    >
      {isVideo ? (
        <img
          src={lut.coverUrl}
          alt={lut.title}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <BeforeAfter
          beforeSrc={lut.beforeUrl ?? lut.coverUrl}
          afterSrc={lut.coverUrl}
          alt={lut.title}
          position={split.position}
          className="absolute inset-0"
        />
      )}

      {isVideo && playing && (
        <video
          src={lut.previewVideoUrl}
          aria-hidden
          muted
          autoPlay
          loop
          playsInline
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
      )}
      {isVideo && (
        <span
          role="img"
          aria-label="Có video xem trước"
          className="pointer-events-none absolute top-3 left-3 z-20 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
        >
          <Play className="size-3 fill-white" />
        </span>
      )}

      {lut.premium && (
        <span
          role="img"
          aria-label="Premium"
          className="pointer-events-none absolute top-3 right-3 z-20 flex size-5 items-center justify-center rounded-full bg-(--sh-pink) text-white"
        >
          <Star className="size-3 fill-white" />
        </span>
      )}

      {/* Lớp tối + thông tin, hiện khi rê chuột hoặc focus bằng bàn phím */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100" />
      <Link
        to="/luts/$slug"
        params={{ slug: lut.slug }}
        aria-label={`Xem LUT ${lut.title}`}
        className="absolute inset-0 z-10 rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-(--sh-pink) focus-visible:ring-inset"
      />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-end justify-between gap-3 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
        <h3 className="truncate pb-1.5 text-base font-semibold text-white">{lut.title}</h3>
        <div className="pointer-events-auto flex shrink-0 items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <ShopButton
                variant="primary"
                size="icon-lg"
                aria-label={`Tải ${lut.title}`}
                disabled={downloading}
                onClick={() => onDownload?.(lut)}
              >
                {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              </ShopButton>
            </TooltipTrigger>
            <TooltipContent>{lut.premium ? "Tải (cần gói Pro)" : "Tải miễn phí"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ShopButton
                variant="overlay"
                size="icon"
                aria-label={`Thêm ${lut.title} vào bộ sưu tập`}
                onClick={() => onAddToCollection?.(lut)}
              >
                <CirclePlus />
              </ShopButton>
            </TooltipTrigger>
            <TooltipContent>Thêm vào bộ sưu tập</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </article>
  );
});
