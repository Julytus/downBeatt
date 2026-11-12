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
import { getAnonId } from "@/lib/recommend/anon-id";
import { clearHistoryMutationOptions } from "@/lib/tanstack/options/recommend";

interface ClearHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Hộp thoại xác nhận xoá lịch sử gợi ý (plan §6.4). */
export function ClearHistoryDialog({ open, onOpenChange }: ClearHistoryDialogProps) {
  const clearMutation = useMutation(clearHistoryMutationOptions);

  const handleConfirm = () => {
    clearMutation.mutate(getAnonId(), {
      onSettled: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="shop rounded-[12px] border-(--sh-border) bg-(--sh-elevated) text-(--sh-fg) sm:max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-bold">
            Xoá lịch sử gợi ý?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-(--sh-muted)">
            DownBeat sẽ quên các LUT bạn đã xem, xem trước, đã ẩn khỏi gợi ý, từ khoá đã tìm và phong cách đã lọc. Lượt tải, bộ sưu tập và sở thích màu vẫn được giữ.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
          <AlertDialogCancel asChild>
            <ShopButton variant="ghost" disabled={clearMutation.isPending}>
              Huỷ
            </ShopButton>
          </AlertDialogCancel>
          <ShopButton
            variant="primary"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={clearMutation.isPending}
            onClick={handleConfirm}
          >
            {clearMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Xoá lịch sử
          </ShopButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
