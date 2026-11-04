import { ShopLogo } from "@/components/shop/layout/shop-logo";
import { cn } from "@/lib/utils";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarNav } from "./sidebar-nav";

interface ShopSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

/** Nội dung sidebar: logo, menu, chân. Dùng chung cho bản desktop và menu mobile. */
export function ShopSidebar({ collapsed = false, onToggleCollapse, onNavigate }: ShopSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-(--sh-bg)">
      <div className={cn("pt-7 pb-6", collapsed ? "flex justify-center" : "px-6")}>
        <ShopLogo compact={collapsed} />
      </div>
      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      <SidebarFooter collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
    </div>
  );
}
