import { Outlet } from "@tanstack/react-router";
import { ShopFooter } from "@/components/shop/layout/footer/shop-footer";
import { ShopHeader } from "@/components/shop/layout/header/shop-header";
import { ShopSidebar } from "@/components/shop/layout/sidebar/shop-sidebar";
import { useShopUiStore } from "@/lib/stores/shop-ui";
import { cn } from "@/lib/utils";
import { ShopShell } from "./shop-shell";

/** Khung các trang duyệt kho: sidebar trái + header + nội dung + footer. */
export function ShopLayout() {
  const collapsed = useShopUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useShopUiStore((s) => s.toggleSidebar);

  return (
    <ShopShell className="flex">
      <aside
        aria-label="Menu chính"
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-(--sh-border) transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        <ShopSidebar collapsed={collapsed} onToggleCollapse={toggleSidebar} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <ShopHeader />
        <main id="shop-main" className="flex-1 px-4 pt-5 pb-16 md:px-12">
          <Outlet />
        </main>
        <ShopFooter />
      </div>
    </ShopShell>
  );
}
