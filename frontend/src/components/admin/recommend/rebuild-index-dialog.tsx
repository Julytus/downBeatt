import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface RebuildIndexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  onConfirm: () => void;
}

export function RebuildIndexDialog({
  open,
  onOpenChange,
  isLoading,
  onConfirm
}: RebuildIndexDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isLoading) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent
        onEscapeKeyDown={(e) => {
          if (isLoading) e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Tính lại chỉ mục gợi ý?</AlertDialogTitle>
          <AlertDialogDescription>
            Hệ thống đo lại đặc trưng màu còn thiếu, dựng lại chỉ mục vector và bảng LUT tương tự.
            Việc này mất vài giây; khối gợi ý ở cửa hàng vẫn chạy bình thường trong lúc tính.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Huỷ</AlertDialogCancel>
          <Button disabled={isLoading} onClick={onConfirm}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang tính…
              </>
            ) : (
              "Tính lại"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
