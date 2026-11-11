import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BookmarkCheck, ChevronRight, CirclePlus, Download, ExternalLink, Loader2, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLutDownload } from "@/hooks/use-lut-download";
import { useSaveToCollection } from "@/hooks/use-save-to-collection";
import { useViewerKey } from "@/hooks/use-viewer-key";
import { LutGrid } from "@/components/shop/luts/lut-grid";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { takeImpression, trackEvent } from "@/lib/recommend/track";
import { canDownloadPremium, useShopSession } from "@/lib/stores/shop-session";
import { myCollectionsQueryOptions } from "@/lib/tanstack/options/collection";
import { createInfiniteRelatedLutsQueryOptions, lutCategoriesQueryOptions } from "@/lib/tanstack/options/luts";
import { LUT_SOFTWARE, LUT_STYLE_LABEL, type LutDTO } from "@/lib/types/lut";
import { formatCompact } from "@/lib/utils/money";
import { LutCompare } from "./lut-compare";
import { LutVideoPreview } from "./lut-video-preview";

export function LutDetail({ lut }: { lut: LutDTO }) {
  const user = useShopSession((s) => s.user);
  const { open: openSaveToCollection } = useSaveToCollection();
  const { download, pendingId } = useLutDownload();
  const { data: myCollections } = useQuery({
    ...myCollectionsQueryOptions(lut.id),
    enabled: !!user
  });
  const isSaved = !!user && !!myCollections?.some((c) => c.containsLut);
  const { data: categories = [] } = useQuery(lutCategoriesQueryOptions);
  const lutCategories = categories.filter((c) => lut.categories.includes(c.slug));
  const locked = lut.premium && !canDownloadPremium(user);
  const downloading = pendingId === lut.id;

  const viewTrackedIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (lut.id && viewTrackedIdRef.current !== lut.id) {
      viewTrackedIdRef.current = lut.id;
      trackEvent("VIEW", { lutId: lut.id, impressionId: takeImpression(lut.id) });
    }
  }, [lut.id]);

  return (
    <article>
      <nav aria-label="Đường dẫn" className="mb-5 text-sm text-(--sh-muted)">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link to="/luts" className="hover:text-(--sh-fg) hover:underline">
              Kho LUT
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="size-3.5" aria-hidden />
            <Link
              to="/luts/danh-muc/$category"
              params={{ category: lut.style }}
              className="hover:text-(--sh-fg) hover:underline"
            >
              {LUT_STYLE_LABEL[lut.style]}
            </Link>
          </li>
          <li aria-current="page" className="flex min-w-0 items-center gap-1 text-(--sh-fg)">
            <ChevronRight className="size-3.5 shrink-0 text-(--sh-muted)" aria-hidden />
            <span className="truncate">{lut.title}</span>
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] lg:items-start">
        {lut.previewType === "video" && lut.previewVideoUrl ? <LutVideoPreview lut={lut} /> : <LutCompare lut={lut} />}

        <div className="flex flex-col gap-5">
          <div>
            {lut.premium && (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-(--sh-active-bg) px-2.5 py-1 text-xs font-semibold text-(--sh-active-fg)">
                <Star className="size-3.5 fill-current" aria-hidden /> LUT Premium
              </span>
            )}
            <h1 className="font-display text-3xl leading-tight font-bold tracking-[-0.5px] md:text-4xl">
              {lut.title}
            </h1>
            <p className="mt-1 text-sm text-(--sh-muted)">
              bởi <span className="font-semibold text-(--sh-fg)">{lut.creator}</span>
            </p>
          </div>

          <p className="text-sm leading-6">{lut.description}</p>

          <div className="flex flex-wrap gap-2">
            <ShopButton variant="primary" className="min-w-40" disabled={downloading} onClick={() => download(lut)}>
              {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {lut.premium ? "Tải LUT Premium" : "Tải miễn phí"}
            </ShopButton>
            <ShopButton
              variant="secondary"
              onClick={() => openSaveToCollection(lut)}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="size-4 text-(--sh-accent)" />
                  Đã lưu
                </>
              ) : (
                <>
                  <CirclePlus className="size-4" />
                  Lưu vào bộ sưu tập
                </>
              )}
            </ShopButton>
          </div>

          {locked && (
            <p className="rounded-[8px] border border-(--sh-border) p-3 text-sm text-(--sh-muted)">
              LUT này cần gói <b className="text-(--sh-fg)">Pro</b> hoặc <b className="text-(--sh-fg)">Studio</b>.{" "}
              <Link to="/pricing" className="font-semibold text-(--sh-accent) underline underline-offset-4">
                Xem bảng giá
              </Link>
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-(--sh-border) pt-5 text-sm">
            <div>
              <dt className="text-(--sh-muted)">Định dạng</dt>
              <dd className="font-semibold">
                .cube (3D LUT{lut.lutSize ? `, ${lut.lutSize}×${lut.lutSize}×${lut.lutSize}` : ""})
              </dd>
            </div>
            <div>
              <dt className="text-(--sh-muted)">Dung lượng</dt>
              <dd className="font-semibold">{(lut.fileSizeKb / 1024).toFixed(1).replace(".", ",")} MB</dd>
            </div>
            <div>
              <dt className="text-(--sh-muted)">Lượt tải</dt>
              <dd className="font-semibold">{formatCompact(lut.downloads)}</dd>
            </div>
            <div>
              <dt className="text-(--sh-muted)">Ngày đăng</dt>
              <dd className="font-semibold">{new Date(lut.createdAt).toLocaleDateString("vi-VN")}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-(--sh-muted)">Tương thích</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {LUT_SOFTWARE.map((s) => (
                  <span key={s} className="rounded-full border border-(--sh-border) px-2.5 py-0.5 text-xs">
                    {s}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <ul aria-label="Danh mục của LUT" className="flex flex-wrap gap-2">
          {lutCategories.map((c) => (
            <li key={c.slug}>
              <Link
                to="/luts/danh-muc/$category"
                params={{ category: c.slug }}
                className="inline-flex h-8 items-center rounded-[8px] bg-(--sh-surface) px-3 text-xs font-semibold transition-colors hover:bg-(--sh-surface-hover)"
              >
                LUT {c.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/luts" hash="huong-dan" className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
          Cách dùng LUT <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>

      <RelatedLuts slug={lut.slug} />
    </article>
  );
}

function RelatedLuts({ slug }: { slug: string }) {
  const { key: viewerKey, ready } = useViewerKey();
  const query = useInfiniteQuery({
    ...createInfiniteRelatedLutsQueryOptions(slug, viewerKey),
    enabled: ready
  });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const { fetchNextPage, refetch } = query;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);

  return (
    <section aria-labelledby="related-title" className="mt-14">
      <h2 id="related-title" className="mb-5 text-lg font-bold">
        Có thể bạn cũng thích
      </h2>
      <LutGrid
        label="LUT liên quan"
        items={items}
        isLoading={query.isPending}
        isError={query.isError}
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        onLoadMore={loadMore}
        onRetry={() => void refetch()}
      />
    </section>
  );
}
