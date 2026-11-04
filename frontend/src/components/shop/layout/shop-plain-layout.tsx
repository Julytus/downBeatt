import { Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ShopFooter } from "@/components/shop/layout/footer/shop-footer";
import { HeaderActions } from "@/components/shop/layout/header/header-actions";
import { ShopLogo } from "@/components/shop/layout/shop-logo";
import { ThemeToggleButton } from "@/components/shop/layout/sidebar/sidebar-footer";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { ShopShell } from "./shop-shell";

/** Khung trang tập trung chuyển đổi (bảng giá): không sidebar, chỉ logo + nút tài khoản. */
export function ShopPlainLayout() {
  return (
    <ShopShell className="flex flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-(--sh-bg) px-4 py-2.5 md:px-12">
        <ShopLogo />
        <ShopButton asChild variant="ghost" size="sm" className="ml-2 hidden md:inline-flex">
          <Link to="/luts">
            <ArrowLeft className="size-4" />
            Kho LUT
          </Link>
        </ShopButton>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggleButton />
          <HeaderActions hidePricing />
        </div>
      </header>
      <main id="shop-main" className="flex-1 px-4 pt-6 pb-16 md:px-12">
        <Outlet />
      </main>
      <ShopFooter />
    </ShopShell>
  );
}
