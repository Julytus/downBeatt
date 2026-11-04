import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { LutDetail } from "@/components/shop/luts/detail/lut-detail";
import { LutDetailSkeleton } from "@/components/shop/luts/detail/lut-detail-skeleton";
import { ShopNotFound } from "@/components/shop/ui/shop-not-found";
import { NotFoundError } from "@/lib/mock/luts";
import { queryClient } from "@/lib/tanstack/query-client";
import { createLutQueryOptions } from "@/lib/tanstack/options/luts";

export const Route = createFileRoute("/_shop/luts/$slug")({
  loader: async ({ params }) => {
    try {
      await queryClient.ensureQueryData(createLutQueryOptions(params.slug));
    } catch (err) {
      if (err instanceof NotFoundError) throw notFound();
      throw err;
    }
  },
  // Hiện khung chờ nếu tải quá 150ms (mặc định 1s là quá lâu với trang chi tiết)
  pendingMs: 150,
  pendingMinMs: 250,
  pendingComponent: LutDetailSkeleton,
  notFoundComponent: () => (
    <ShopNotFound
      title="Không tìm thấy LUT"
      description="LUT này không tồn tại hoặc đã bị gỡ. Hãy xem các LUT khác trong kho."
    />
  ),
  component: LutDetailPage
});

function LutDetailPage() {
  const { slug } = Route.useParams();
  const { data: lut } = useSuspenseQuery(createLutQueryOptions(slug));

  useEffect(() => {
    document.title = `${lut.title} – LUT ${lut.premium ? "Premium" : "miễn phí"} | DownBeat`;
  }, [lut]);

  return <LutDetail key={lut.id} lut={lut} />;
}
