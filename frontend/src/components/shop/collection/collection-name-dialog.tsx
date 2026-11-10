import { useMutation } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { ShopField } from "@/components/shop/ui/shop-field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { createSaveCollectionMutationOptions } from "@/lib/tanstack/options/collection";
import type { CollectionDTO } from "@/lib/types/collection";
import { getServerErrorCode } from "@/lib/types/common";

interface CollectionNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: CollectionDTO | null;
  onSuccess?: (coll: CollectionDTO) => void;
}

export function CollectionNameDialog({
  open,
  onOpenChange,
  collection,
  onSuccess
}: CollectionNameDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const isEdit = collection !== null;
  const title = isEdit ? "Đổi tên bộ sưu tập" : "Tạo bộ sưu tập";
  const submitLabel = isEdit ? "Lưu" : "Tạo";

  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setName(collection?.name ?? "");
      setError(undefined);
      // Khi mở hộp thoại đổi tên, chọn toàn bộ chữ (plan §6.5)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (isEdit) {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [open, collection, isEdit]);

  // Mutation lưu bộ sưu tập dùng options có meta (thông báo và invalidate do MutationCache xử lý)
  const mutation = useMutation({
    ...createSaveCollectionMutationOptions({ isEdit }),
    onSuccess: (data) => {
      onOpenChange(false);
      onSuccess?.(data);
    },
    onError: (err) => {
      const code = getServerErrorCode(err);
      if (code === "COLLECTION_NAME_EXISTS") {
        setError("Bạn đã có bộ sưu tập tên này");
        return;
      }
      if (code === "COLLECTION_LIMIT") {
        onOpenChange(false);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nhập tên bộ sưu tập");
      return;
    }
    if (trimmed.length > 100) {
      setError("Tên tối đa 100 ký tự");
      return;
    }
    setError(undefined);
    mutation.mutate({ id: collection?.id, name: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="shop max-h-[calc(100dvh-2rem)] rounded-[12px] border-(--sh-border) bg-(--sh-elevated) p-6 text-(--sh-fg) sm:max-w-[420px]"
      >
        <DialogClose asChild>
          <ShopButton variant="ghost" size="icon-sm" aria-label="Đóng" className="absolute top-4 right-4">
            <X />
          </ShopButton>
        </DialogClose>

        <DialogTitle className="font-display text-xl font-bold">{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <ShopField
            ref={inputRef}
            label="Tên bộ sưu tập"
            placeholder="Ví dụ: Phim cưới mùa thu"
            value={name}
            error={error}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(undefined);
            }}
          />

          <div className="flex justify-end gap-2 pt-2">
            <ShopButton
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </ShopButton>
            <ShopButton
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {submitLabel}
            </ShopButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
