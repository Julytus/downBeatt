import { createFileRoute } from "@tanstack/react-router";
import { ShopPlainLayout } from "@/components/shop/layout/shop-plain-layout";

/** Layout cửa hàng không có sidebar (trang bảng giá). */
export const Route = createFileRoute("/_plain")({ component: ShopPlainLayout });
