import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Thanh tiến trình mảnh trên cùng khi đang chuyển trang (loader của route đang chạy).
 * Chỉ hiện nếu chờ quá 150ms để chuyển trang nhanh không bị nháy.
 */
export function RouteProgress() {
  const loading = useRouterState({ select: (s) => s.status === "pending" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <div
      role="progressbar"
      aria-label="Đang tải trang"
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="shop-progress h-full w-1/3 rounded-full bg-(--sh-pink)" />
    </div>
  );
}
