import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { formatPlanDate } from "@/lib/utils/plan";

interface CancelPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  endDate?: string;
  isLoading: boolean;
  onConfirm: () => void;
}

export function CancelPlanDialog({
  open,
  onOpenChange,
  planName,
  endDate,
  isLoading,
  onConfirm
}: CancelPlanDialogProps) {
  const formattedEndDate = formatPlanDate(endDate);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="shop max-w-md border-(--sh-border) bg-(--sh-elevated) text-(--sh-fg)">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl">
            Huỷ gói {planName}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-(--sh-muted)">
            Bạn vẫn dùng gói {planName} đến hết ngày {formattedEndDate}. Sau ngày này tài khoản trở về gói Miễn phí. Số tiền đã thanh toán không được hoàn lại.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel
            disabled={isLoading}
            className="border-(--sh-border) bg-(--sh-surface) text-(--sh-fg) hover:bg-(--sh-surface-hover)"
          >
            Giữ gói
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Đang huỷ…" : "Huỷ gói"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
