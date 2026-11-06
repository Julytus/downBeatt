import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Query danh sách lỗi (5xx, mất mạng): báo ngay trên bảng + nút thử lại. Query không bật toast. */
export function AdminListError({
  title = "Không tải được danh sách",
  onRetry
}: {
  title?: string;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        Kiểm tra kết nối tới máy chủ rồi thử lại.
        <Button size="sm" variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      </AlertDescription>
    </Alert>
  );
}
