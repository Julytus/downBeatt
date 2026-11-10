import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FolderHeart, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopSession } from "@/lib/stores/shop-session";
import { myCollectionsQueryOptions } from "@/lib/tanstack/options/collection";
import {
  FREE_COLLECTION_LIMIT,
  type CollectionDTO
} from "@/lib/types/collection";
import { CollectionCard } from "./collection-card";
import { CollectionLoginPrompt } from "./collection-login-prompt";
import { CollectionNameDialog } from "./collection-name-dialog";
import { DeleteCollectionDialog } from "./delete-collection-dialog";

export function CollectionsPage() {
  const user = useShopSession((s) => s.user);
  const loading = useShopSession((s) => s.loading);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CollectionDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionDTO | null>(null);

  useEffect(() => {
    document.title = "Bộ sưu tập của tôi | DownBeat";
  }, []);

  const {
    data: collections,
    isLoading,
    isError,
    refetch
  } = useQuery({
    ...myCollectionsQueryOptions(),
    enabled: !!user
  });

  // Đang nạp phiên đăng nhập
  if (loading && !user) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-[6px] bg-(--sh-surface)" />
          <Skeleton className="h-4 w-32 rounded-[4px] bg-(--sh-surface)" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-[12px] bg-(--sh-surface)" />
          ))}
        </div>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return <CollectionLoginPrompt />;
  }

  const isFree = user.plan === "free";
  const total = collections?.length ?? 0;
  const atLimit = isFree && total >= FREE_COLLECTION_LIMIT;

  return (
    <div className="space-y-6">
      {/* Đầu trang */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.5px] text-(--sh-fg) md:text-3xl">
            Bộ sưu tập của tôi
          </h1>
          <p className="mt-1 text-sm text-(--sh-muted)">
            {isFree
              ? `${total} bộ sưu tập · Gói Miễn phí: tối đa 3 bộ`
              : `${total} bộ sưu tập`}
          </p>
        </div>

        <ShopButton
          variant="primary"
          disabled={atLimit}
          onClick={() => setCreateOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Tạo bộ sưu tập
        </ShopButton>
      </div>

      {/* Băng thông báo hết lượt (Gói Miễn phí đủ 3 bộ) */}
      {atLimit && (
        <div className="rounded-[8px] border border-(--sh-border) bg-(--sh-surface) p-3 text-sm">
          <p className="text-(--sh-muted)">
            <span>Bạn đã dùng hết 3 bộ sưu tập của gói Miễn phí.</span>{" "}
            <Link
              to="/pricing"
              className="font-semibold text-(--sh-accent) underline underline-offset-4"
            >
              Nâng cấp Pro
            </Link>
          </p>
        </div>
      )}

      {/* Đang tải dữ liệu */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-[12px] bg-(--sh-surface)" />
          ))}
        </div>
      )}

      {/* Lỗi tải */}
      {isError && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="font-semibold text-(--sh-danger)">Không tải được bộ sưu tập</p>
          <ShopButton variant="secondary" size="sm" onClick={() => void refetch()}>
            Thử lại
          </ShopButton>
        </div>
      )}

      {/* Danh sách trống */}
      {!isLoading && !isError && total === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[12px] border border-dashed border-(--sh-border) p-12 text-center">
          <FolderHeart className="size-10 stroke-[1.5] text-(--sh-muted)" aria-hidden />
          <h2 className="mt-2 text-lg font-semibold text-(--sh-fg)">Chưa có bộ sưu tập nào</h2>
          <p className="max-w-md text-sm text-(--sh-muted)">
            Lưu các LUT cùng gu vào một bộ để dùng lại cho cả dự án.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <ShopButton variant="primary" onClick={() => setCreateOpen(true)}>
              Tạo bộ sưu tập
            </ShopButton>
            <ShopButton asChild variant="secondary">
              <Link to="/luts">Khám phá kho LUT</Link>
            </ShopButton>
          </div>
        </div>
      )}

      {/* Lưới các bộ sưu tập */}
      {!isLoading && !isError && total > 0 && (
        <ul
          aria-label="Bộ sưu tập của tôi"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {collections!.map((coll) => (
            <li key={coll.id}>
              <CollectionCard
                collection={coll}
                onRename={(c) => setRenameTarget(c)}
                onDelete={(c) => setDeleteTarget(c)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Hộp thoại tạo mới */}
      <CollectionNameDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        collection={null}
      />

      {/* Hộp thoại đổi tên */}
      <CollectionNameDialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
        collection={renameTarget}
      />

      {/* Hộp thoại xoá */}
      <DeleteCollectionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        collection={deleteTarget}
      />
    </div>
  );
}
