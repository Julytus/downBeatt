import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { FolderHeart, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LutCard } from "@/components/shop/luts/lut-card";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { ShopError } from "@/components/shop/ui/shop-error";
import { ShopNotFound } from "@/components/shop/ui/shop-not-found";
import { Skeleton } from "@/components/ui/skeleton";
import { isNotFoundError } from "@/lib/axios/luts";
import { useLutDownload } from "@/hooks/use-lut-download";
import { useSaveToCollection } from "@/hooks/use-save-to-collection";
import { useShopSession } from "@/lib/stores/shop-session";
import {
  collectionQueryOptions,
  createAddCollectionItemMutationOptions,
  createRemoveCollectionItemMutationOptions
} from "@/lib/tanstack/options/collection";
import type { LutDTO } from "@/lib/types/lut";
import { CollectionLoginPrompt } from "./collection-login-prompt";
import { CollectionNameDialog } from "./collection-name-dialog";
import { DeleteCollectionDialog } from "./delete-collection-dialog";

interface CollectionDetailPageProps {
  id: string;
}

export function CollectionDetailPage({ id }: CollectionDetailPageProps) {
  const navigate = useNavigate();
  const user = useShopSession((s) => s.user);
  const loading = useShopSession((s) => s.loading);
  const { download, pendingId } = useLutDownload();
  const { open: openSaveToCollection } = useSaveToCollection();

  const numId = Number(id);
  const isInvalidId = !id || isNaN(numId) || numId <= 0 || !Number.isInteger(numId);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [items, setItems] = useState<LutDTO[]>([]);

  const removeMutation = useMutation(createRemoveCollectionItemMutationOptions({ silentSuccess: true }));
  const addMutation = useMutation(createAddCollectionItemMutationOptions({ silentSuccess: true }));

  const {
    data: collection,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    ...collectionQueryOptions(numId),
    enabled: !!user && !isInvalidId
  });

  // Đồng bộ danh sách LUT từ query vào state cục bộ để hỗ trợ hoàn tác mượt mà
  useEffect(() => {
    if (collection?.luts) {
      setItems(collection.luts);
    }
  }, [collection?.luts]);

  // Cập nhật tiêu đề trang theo plan §6.7
  useEffect(() => {
    if (collection?.name) {
      document.title = `${collection.name} – Bộ sưu tập | DownBeat`;
    }
  }, [collection?.name]);

  // Id không hợp lệ (ví dụ "abc", "-1")
  if (isInvalidId) {
    return (
      <ShopNotFound
        title="Không tìm thấy bộ sưu tập"
        description="Bộ sưu tập này không tồn tại hoặc đã bị xoá."
      />
    );
  }

  // Đang nạp phiên đăng nhập
  if (loading && !user) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-[4px] bg-(--sh-surface)" />
          <Skeleton className="h-8 w-60 rounded-[6px] bg-(--sh-surface)" />
          <Skeleton className="h-4 w-24 rounded-[4px] bg-(--sh-surface)" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-[8px] bg-(--sh-surface)" />
          ))}
        </div>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return <CollectionLoginPrompt />;
  }

  // 404 từ backend (bộ không tồn tại hoặc của người khác)
  if (isError && isNotFoundError(error)) {
    return (
      <ShopNotFound
        title="Không tìm thấy bộ sưu tập"
        description="Bộ sưu tập này không tồn tại hoặc đã bị xoá."
      />
    );
  }

  // Lỗi mạng hoặc lỗi khác
  if (isError) {
    return <ShopError title="Không tải được bộ sưu tập" onRetry={refetch} />;
  }

  // Đang tải dữ liệu
  if (isLoading || !collection) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-[4px] bg-(--sh-surface)" />
          <Skeleton className="h-8 w-60 rounded-[6px] bg-(--sh-surface)" />
          <Skeleton className="h-4 w-24 rounded-[4px] bg-(--sh-surface)" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-[8px] bg-(--sh-surface)" />
          ))}
        </div>
      </div>
    );
  }

  // Bỏ LUT khỏi bộ sưu tập kèm hỗ trợ hoàn tác trong 5 giây (plan §6.7, §8.3)
  const handleRemove = (lut: LutDTO) => {
    // Tạm ẩn thẻ khỏi giao diện
    setItems((prev) => prev.filter((item) => item.id !== lut.id));

    removeMutation.mutate(
      { collectionId: collection.id, lutId: lut.id },
      {
        onError: () => {
          // Lỗi: hoàn trả thẻ về danh sách (MutationCache tự hiện thông báo lỗi)
          setItems((prev) => [lut, ...prev.filter((x) => x.id !== lut.id)]);
        },
        onSuccess: () => {
          // Ngoại lệ: Toast "Đã bỏ khỏi bộ sưu tập" có nút "Hoàn tác" cần action nên gọi toast() trực tiếp ở đây (plan §8.3)
          toast(`Đã bỏ “${lut.title}” khỏi bộ sưu tập`, {
            duration: 5000,
            action: {
              label: "Hoàn tác",
              onClick: () => {
                setItems((prev) => [lut, ...prev.filter((x) => x.id !== lut.id)]);
                addMutation.mutate({ collectionId: collection.id, lutId: lut.id });
              }
            }
          });
        }
      }
    );
  };

  const lutCount = items.length;

  return (
    <div className="space-y-6">
      {/* Đường dẫn */}
      <nav aria-label="Đường dẫn" className="flex items-center gap-1.5 text-sm text-(--sh-muted)">
        <Link to="/bo-suu-tap" className="transition-colors hover:text-(--sh-fg)">
          Bộ sưu tập của tôi
        </Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-(--sh-fg)">{collection.name}</span>
      </nav>

      {/* Đầu trang: Tiêu đề + số LUT + nút thao tác */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.5px] text-(--sh-fg) md:text-3xl">
            {collection.name}
          </h1>
          <p className="mt-1 text-sm text-(--sh-muted)">{lutCount} LUT</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ShopButton
            variant="secondary"
            onClick={() => setRenameOpen(true)}
          >
            <Pencil className="size-4" />
            Đổi tên
          </ShopButton>

          <ShopButton
            variant="secondary"
            onClick={() => setDeleteOpen(true)}
            className="text-(--sh-danger) hover:text-(--sh-danger)"
          >
            <Trash2 className="size-4" />
            Xoá
          </ShopButton>

          <ShopButton asChild variant="primary">
            <Link to="/luts">Thêm LUT từ kho</Link>
          </ShopButton>
        </div>
      </div>

      {/* Bộ sưu tập trống */}
      {lutCount === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[12px] border border-dashed border-(--sh-border) p-12 text-center">
          <FolderHeart className="size-10 stroke-[1.5] text-(--sh-muted)" aria-hidden />
          <h2 className="mt-2 text-lg font-semibold text-(--sh-fg)">Bộ sưu tập này chưa có LUT</h2>
          <p className="max-w-md text-sm text-(--sh-muted)">
            Bấm nút + trên thẻ LUT trong kho để lưu vào đây.
          </p>
          <ShopButton asChild variant="primary" className="mt-4">
            <Link to="/luts">Khám phá kho LUT</Link>
          </ShopButton>
        </div>
      )}

      {/* Lưới LUT */}
      {lutCount > 0 && (
        <ul
          aria-label={collection.name}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {items.map((lut) => (
            <li key={lut.id}>
              <LutCard
                lut={lut}
                onDownload={download}
                onAddToCollection={openSaveToCollection}
                onRemove={handleRemove}
                downloading={pendingId === lut.id}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Hộp thoại đổi tên */}
      <CollectionNameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        collection={collection}
      />

      {/* Hộp thoại xoá */}
      <DeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
        onSuccess={() => void navigate({ to: "/bo-suu-tap" })}
      />
    </div>
  );
}
