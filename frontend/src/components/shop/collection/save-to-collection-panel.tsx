import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { ShopField } from "@/components/shop/ui/shop-field";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopSession } from "@/lib/stores/shop-session";
import {
  addCollectionItemMutationOptions,
  createSaveCollectionMutationOptions,
  myCollectionsQueryOptions,
  removeCollectionItemMutationOptions
} from "@/lib/tanstack/options/collection";
import {
  FREE_COLLECTION_LIMIT,
  type CollectionDTO
} from "@/lib/types/collection";
import { getServerErrorCode } from "@/lib/types/common";
import type { LutDTO } from "@/lib/types/lut";

interface SaveToCollectionPanelProps {
  lut: LutDTO;
  onClose: () => void;
}

export function SaveToCollectionPanel({ lut, onClose }: SaveToCollectionPanelProps) {
  const user = useShopSession((s) => s.user);

  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [pendingCollId, setPendingCollId] = useState<number | null>(null);
  const [hitLimit, setHitLimit] = useState(false);

  const {
    data: collections,
    isLoading,
    isError,
    refetch
  } = useQuery(myCollectionsQueryOptions(lut.id));

  const isFree = user?.plan === "free";
  const atLimit = (isFree && (collections?.length ?? 0) >= FREE_COLLECTION_LIMIT) || hitLimit;

  // Mutations thêm / bỏ LUT dùng options có meta (thông báo và invalidate do MutationCache xử lý)
  const addMutation = useMutation({
    ...addCollectionItemMutationOptions,
    onSettled: () => setPendingCollId(null)
  });

  const removeMutation = useMutation({
    ...removeCollectionItemMutationOptions,
    onSettled: () => setPendingCollId(null)
  });

  // Toggle lưu / bỏ lưu LUT vào bộ
  const handleToggle = (c: CollectionDTO) => {
    if (pendingCollId !== null) return;
    setPendingCollId(c.id);
    if (c.containsLut) {
      removeMutation.mutate({ collectionId: c.id, lutId: lut.id });
    } else {
      addMutation.mutate({ collectionId: c.id, lutId: lut.id });
    }
  };

  // Mutation tạo bộ mới kèm LUT dùng options có meta
  const createMutation = useMutation({
    ...createSaveCollectionMutationOptions({ hasLut: true }),
    onSuccess: () => {
      setNewName("");
      setNameError(undefined);
    },
    onError: (err) => {
      const code = getServerErrorCode(err);
      if (code === "COLLECTION_NAME_EXISTS") {
        setNameError("Bạn đã có bộ sưu tập tên này");
        return;
      }
      if (code === "COLLECTION_LIMIT") {
        setHitLimit(true);
      }
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setNameError("Nhập tên bộ sưu tập");
      return;
    }
    if (trimmed.length > 100) {
      setNameError("Tên tối đa 100 ký tự");
      return;
    }
    setNameError(undefined);
    createMutation.mutate({ name: trimmed, lutId: lut.id });
  };

  const isCollectionsEmpty = !!collections && collections.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <DialogDescription className="mt-2 mb-2 text-sm text-(--sh-muted)">
        {isCollectionsEmpty
          ? "Đặt tên cho bộ sưu tập đầu tiên của bạn."
          : "Chọn một hoặc nhiều bộ. Bấm lần nữa để bỏ lưu."}
      </DialogDescription>

      {/* Trạng thái tải */}
      {isLoading && (
        <div className="space-y-2 py-2" aria-busy="true">
          <Skeleton className="h-9 w-full rounded-[6px] bg-(--sh-surface)" />
          <Skeleton className="h-9 w-full rounded-[6px] bg-(--sh-surface)" />
          <Skeleton className="h-9 w-full rounded-[6px] bg-(--sh-surface)" />
        </div>
      )}

      {/* Trạng thái lỗi */}
      {isError && (
        <div className="flex flex-col items-center gap-2 rounded-[8px] border border-(--sh-border) p-4 text-center">
          <p className="text-sm text-(--sh-danger)">Không tải được bộ sưu tập</p>
          <ShopButton variant="secondary" size="sm" onClick={() => void refetch()}>
            Thử lại
          </ShopButton>
        </div>
      )}

      {/* Danh sách bộ sưu tập */}
      {!isLoading && !isError && collections && collections.length > 0 && (
        <ul
          aria-label="Bộ sưu tập của bạn"
          className="max-h-56 overflow-y-auto divide-y divide-(--sh-border)/40 pr-1"
        >
          {collections.map((c) => {
            const isRowPending = pendingCollId === c.id;
            return (
              <li
                key={c.id}
                className="flex items-center justify-between py-2 transition-colors hover:bg-(--sh-surface)/50"
              >
                <label
                  htmlFor={`coll-${c.id}`}
                  className="flex flex-1 cursor-pointer items-center gap-3 select-none"
                >
                  <Checkbox
                    id={`coll-${c.id}`}
                    aria-label={c.name}
                    checked={!!c.containsLut}
                    disabled={isRowPending}
                    onCheckedChange={() => handleToggle(c)}
                  />
                  <span className="text-sm font-medium">{c.name}</span>
                </label>
                <span className="shrink-0 pl-2 text-xs text-(--sh-muted)">
                  {isRowPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : c.itemCount > 0 ? (
                    `${c.itemCount} LUT`
                  ) : (
                    "Trống"
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Khối tạo bộ mới hoặc hết lượt */}
      {!isLoading && !isError && (
        <>
          {atLimit ? (
            <div className="rounded-[8px] border border-(--sh-border) bg-(--sh-surface) p-3 text-sm">
              <p className="text-(--sh-muted)">
                <span>Gói Miễn phí lưu được tối đa 3 bộ sưu tập.</span>{" "}
                <Link
                  to="/pricing"
                  onClick={onClose}
                  className="font-semibold text-(--sh-accent) underline underline-offset-4"
                >
                  Nâng cấp Pro
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="pt-1">
              <div className="flex items-end gap-2">
                <ShopField
                  label="Tên bộ sưu tập mới"
                  placeholder="Ví dụ: Phim cưới mùa thu"
                  value={newName}
                  error={nameError}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (nameError) setNameError(undefined);
                  }}
                  className="flex-1"
                />
                <ShopButton
                  type="submit"
                  variant="secondary"
                  disabled={createMutation.isPending}
                  className="mb-0.5"
                >
                  {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Tạo và lưu
                </ShopButton>
              </div>
            </form>
          )}
        </>
      )}

      {/* Chân hộp thoại */}
      <div className="mt-2 flex items-center justify-between border-t border-(--sh-border) pt-4">
        <Link
          to="/bo-suu-tap"
          onClick={onClose}
          className="text-xs font-semibold text-(--sh-muted) underline-offset-4 hover:text-(--sh-fg) hover:underline"
        >
          Xem bộ sưu tập của tôi
        </Link>
        <ShopButton variant="primary" onClick={onClose}>
          Xong
        </ShopButton>
      </div>
    </div>
  );
}
