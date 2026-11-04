import { ChevronsLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/theme/theme-provider";
import { SOCIAL_LINKS } from "@/components/shop/ui/brand-icons";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { cn } from "@/lib/utils";

/** Sidebar hẹp nên chỉ hiện Instagram + Discord; footer hiện đủ */
const SIDEBAR_SOCIALS = SOCIAL_LINKS.filter((s) => s.id !== "youtube");

function useIsDark() {
  const { theme } = useTheme();
  if (theme !== "system") return theme === "dark";
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface SidebarFooterProps {
  collapsed?: boolean;
  /** Không truyền thì ẩn nút thu gọn (menu mobile) */
  onToggleCollapse?: () => void;
}

/** Nút đổi sáng / tối (dùng ở sidebar và header trang bảng giá) */
export function ThemeToggleButton() {
  const { setTheme } = useTheme();
  const isDark = useIsDark();
  return (
    <ShopButton
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
    >
      {isDark ? <Moon /> : <Sun />}
    </ShopButton>
  );
}

export function SidebarFooter({ collapsed = false, onToggleCollapse }: SidebarFooterProps) {

  return (
    <div
      className={cn(
        "flex px-4 py-5 text-(--sh-fg)",
        collapsed ? "flex-col items-center gap-2" : "items-center justify-between"
      )}
    >
      <div className={cn("flex", collapsed && "flex-col gap-2")}>
        {onToggleCollapse && (
          <ShopButton
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            aria-expanded={!collapsed}
          >
            <ChevronsLeft className={cn("transition-transform", collapsed && "rotate-180")} />
          </ShopButton>
        )}
        <ThemeToggleButton />
      </div>

      {!collapsed && (
        <div className="flex gap-1.5 text-(--sh-nav)">
          {SIDEBAR_SOCIALS.map((s) => (
            <ShopButton key={s.label} asChild variant="ghost" size="icon-sm">
              <a href={s.href} aria-label={s.label}>
                <s.icon />
              </a>
            </ShopButton>
          ))}
        </div>
      )}
    </div>
  );
}
