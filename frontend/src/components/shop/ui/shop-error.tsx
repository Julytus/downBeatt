import { useRouter } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { ShopButton } from "./shop-button";

/** Khung thông báo lỗi tải trang bên trong cửa hàng (cùng khung với ShopNotFound) */
export function ShopError({
  title,
  description = "Kiểm tra kết nối rồi thử lại.",
  onRetry
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <AlertTriangle className="size-10 text-(--sh-muted)" aria-hidden />
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="max-w-md text-sm text-(--sh-muted)">{description}</p>
      <ShopButton
        variant="primary"
        className="mt-2"
        onClick={() => {
          router.invalidate();
          onRetry?.();
        }}
      >
        Thử lại
      </ShopButton>
    </div>
  );
}
