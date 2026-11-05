import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeaderActions } from "@/components/shop/layout/header/header-actions";
import { MobileNav } from "@/components/shop/layout/header/mobile-nav";
import { ShopLogo } from "@/components/shop/layout/shop-logo";
import { SHOP_NAV_GROUPS } from "@/components/shop/layout/sidebar/nav-config";
import { ThemeToggleButton } from "@/components/shop/layout/sidebar/sidebar-footer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const TARGET_NAV_IDS = ["music", "sfx", "video", "motion", "luts"];
const NAV_ITEMS = SHOP_NAV_GROUPS[0].filter((item) =>
  TARGET_NAV_IDS.includes(item.id)
);

export function HomeHeader() {
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("hero-cta-button");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hiện khi nút "Khám phá kho LUT" của hero KHÔNG còn trong khung nhìn
        setNavVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-(--sh-border)/40 bg-(--sh-bg) px-4 md:px-8"
    >
      {/* Trái: Logo */}
      <div className="flex items-center">
        <ShopLogo className="hidden sm:inline-flex" />
        <ShopLogo compact className="sm:hidden" />
      </div>

      {/* Giữa: Menu loại tài nguyên (chỉ >= lg, ẩn khi ở hero) */}
      <nav
        aria-label="Danh mục chính"
        className={cn(
          "hidden items-center gap-6 text-sm transition-all duration-200 lg:flex",
          navVisible
            ? "visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        )}
      >
        {NAV_ITEMS.map((item) =>
          item.to ? (
            <Link
              key={item.id}
              to={item.to}
              className="text-xs font-semibold text-(--sh-fg) transition-colors hover:text-(--sh-primary)"
            >
              {item.label}
            </Link>
          ) : (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <a
                  href="#"
                  aria-disabled="true"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-(--sh-muted) transition-colors hover:text-(--sh-fg)"
                >
                  {item.label}
                </a>
              </TooltipTrigger>
              <TooltipContent>Sắp ra mắt</TooltipContent>
            </Tooltip>
          )
        )}
      </nav>

      {/* Phải: Nút sáng / tối + Nút tài khoản + Mobile menu */}
      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggleButton />
        <HeaderActions />
        <MobileNav />
      </div>
    </header>
  );
}
