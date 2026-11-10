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

export interface LutHideDialogProps {
  open: boolean;
  lutId: number | null;
  lutTitle?: string;
  isLoading?: boolean;
  onConfirm: (id: number) => void;
  onOpenChange: (open: boolean) => void;
}

export function LutHideDialog({
  open,
  lutId,
  lutTitle,
  isLoading,
  onConfirm,
  onOpenChange
}: LutHideDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ẩn LUT {lutTitle}?</AlertDialogTitle>
          <AlertDialogDescription>
            LUT biến khỏi cửa hàng ngay. Bạn có thể xuất bản lại sau.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading || lutId === null}
            onClick={() => {
              if (lutId !== null) {
                onConfirm(lutId);
              }
            }}
          >
            {isLoading ? "Đang ẩn…" : "Ẩn"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
