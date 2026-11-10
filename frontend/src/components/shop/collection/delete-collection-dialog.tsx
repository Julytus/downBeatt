import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { createDeleteCollectionMutationOptions } from "@/lib/tanstack/options/collection";
import type { CollectionDTO } from "@/lib/types/collection";

interface DeleteCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: CollectionDTO | null;
  onSuccess?: () => void;
}

export function DeleteCollectionDialog({
  open,
  onOpenChange,
  collection,
  onSuccess
}: DeleteCollectionDialogProps) {
  // Mutation xoá dùng options có meta (thông báo và invalidate do MutationCache xử lý)
  const mutation = useMutation({
    ...createDeleteCollectionMutationOptions(collection?.name),
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    }
  });

  const handleConfirm = () => {
    if (!collection) return;
    mutation.mutate(collection.id);
  };

  const description =
    collection && collection.itemCount > 0
      ? `${collection.itemCount} LUT trong bộ sẽ được bỏ lưu, LUT vẫn còn trong kho. Không hoàn tác được.`
      : "Không hoàn tác được.";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="shop max-h-[calc(100dvh-2rem)] rounded-[12px] border-(--sh-border) bg-(--sh-elevated) p-6 text-(--sh-fg) sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-bold">
            Xoá bộ sưu tập “{collection?.name}”?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-(--sh-muted)">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
          <AlertDialogCancel asChild>
            <ShopButton variant="secondary" disabled={mutation.isPending}>
              Huỷ
            </ShopButton>
          </AlertDialogCancel>
          <ShopButton
            variant="secondary"
            disabled={mutation.isPending}
            onClick={handleConfirm}
            className="bg-(--sh-danger) text-white hover:bg-(--sh-danger)/90 focus-visible:ring-(--sh-danger)/50"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Xoá bộ sưu tập
          </ShopButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
