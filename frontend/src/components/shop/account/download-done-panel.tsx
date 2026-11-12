import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLutDownload } from "@/hooks/use-lut-download";
import { useViewerKey } from "@/hooks/use-viewer-key";
import { createRelatedLutsQueryOptions } from "@/lib/tanstack/options/luts";
import type { LutDTO } from "@/lib/types/lut";

interface DownloadDonePanelProps {
  lut: LutDTO;
  fileName?: string;
  onClose: () => void;
}

function RelatedLutsSection({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { key: viewerKey, ready } = useViewerKey();
  const { data, isLoading, isError } = useQuery({
    ...createRelatedLutsQueryOptions(slug, 4, viewerKey),
    enabled: ready
  });

  if (isError) return null;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wider text-(--sh-muted) uppercase">
          LUT tương tự
        </h3>
        <ul aria-label="LUT tương tự" className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="space-y-1.5">
              <Skeleton className="aspect-video w-full rounded-[6px] bg-(--sh-surface)" />
              <Skeleton className="h-3.5 w-3/4 rounded bg-(--sh-surface)" />
              <Skeleton className="h-3 w-1/2 rounded bg-(--sh-surface)" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const items = (data?.items ?? []).filter((item) => item.slug !== slug).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wider text-(--sh-muted) uppercase">
        LUT tương tự
      </h3>
      <ul aria-label="LUT tương tự" className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <Link
              to="/luts/$slug"
              params={{ slug: item.slug }}
              onClick={onClose}
              className="group flex flex-col gap-1.5 rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--sh-pink)/60"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-[6px] bg-(--sh-surface)">
                <img
                  src={item.coverUrl}
                  alt=""
                  className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                {item.premium && (
                  <span
                    role="img"
                    aria-label="Premium"
                    className="pointer-events-none absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-(--sh-pink) text-white"
                  >
                    <Star className="size-2.5 fill-white" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-(--sh-fg) group-hover:text-(--sh-primary)">
                  {item.title}
                </p>
                <p className="truncate text-[11px] text-(--sh-muted)">
                  {item.creator}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DownloadDonePanel({ lut, onClose }: DownloadDonePanelProps) {
  const { download, pendingId } = useLutDownload();

  return (
    <div className="flex flex-col gap-5">
      {/* Khối Cách dùng */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wider text-(--sh-muted) uppercase">
          Cách dùng
        </h3>
        <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-(--sh-muted) sm:text-sm">
          <li>Giải nén file .zip, file LUT nằm trong thư mục Assets.</li>
          <li>Kéo file .cube vào Premiere Pro, DaVinci Resolve, Final Cut Pro hoặc CapCut.</li>
        </ol>
      </div>

      {/* Dòng phụ */}
      <div className="flex items-center gap-1.5 text-xs text-(--sh-muted)">
        <span>Không thấy file?</span>
        <button
          type="button"
          onClick={() => download(lut)}
          disabled={pendingId === lut.id}
          className="inline-flex items-center gap-1 font-semibold text-(--sh-fg) underline underline-offset-4 hover:text-(--sh-primary) disabled:opacity-50"
        >
          {pendingId === lut.id && <Loader2 className="size-3 animate-spin" />}
          Tải lại
        </button>
      </div>

      {/* Khối LUT tương tự */}
      <RelatedLutsSection slug={lut.slug} onClose={onClose} />

      {/* Chân */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <ShopButton variant="secondary" asChild onClick={onClose}>
          <Link to="/luts">Xem thêm LUT</Link>
        </ShopButton>
        <ShopButton variant="primary" onClick={onClose}>
          Đóng
        </ShopButton>
      </div>
    </div>
  );
}
