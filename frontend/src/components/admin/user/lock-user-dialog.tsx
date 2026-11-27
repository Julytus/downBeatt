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
import type { UserAdminItem } from "@/lib/types/user-admin";

/** Hộp thoại "Khoá tài khoản?" (plan §6.4). Trang cha giữ mutation, đóng khi thành công; lỗi thì giữ mở. */
export function LockUserDialog({
  user,
  isLoading,
  onOpenChange,
  onConfirm
}: {
  user: UserAdminItem | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (user: UserAdminItem) => void;
}) {
  return (
    <AlertDialog open={user !== null} onOpenChange={(open) => {
        if (!isLoading) onOpenChange(open);
      }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Khoá tài khoản?</AlertDialogTitle>
          <AlertDialogDescription>
            {user?.name} ({user?.email}) sẽ bị đăng xuất khỏi mọi thiết bị và không đăng nhập được cho tới khi được
            mở khoá. Gói và đơn hàng vẫn giữ nguyên.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Huỷ</AlertDialogCancel>
          <Button variant="destructive" disabled={isLoading} onClick={() => user && onConfirm(user)}>
            {isLoading && <Loader2 className="animate-spin" />}
            Khoá tài khoản
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
