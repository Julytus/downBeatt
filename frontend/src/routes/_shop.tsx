import { createFileRoute } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/layout/shop-layout";

/**
 * Layout không đổi URL cho mọi trang cửa hàng (khách không cần đăng nhập).
 * Trang mới: tạo file trong `routes/_shop/` và thêm `to` vào `components/shop/layout/sidebar/nav-config.ts`.
 */
export const Route = createFileRoute("/_shop")({
  component: ShopLayout
});
