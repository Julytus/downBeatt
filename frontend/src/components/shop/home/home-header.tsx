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
    const target = document.getElementById("hero-title");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hiện khi tiêu đề hero đã cuộn khỏi khung nhìn (như bản tham chiếu)
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
      className={cn(
        "sticky top-0 z-30 flex h-[72px] items-center gap-4 px-4 transition-colors duration-200 md:px-6",
        // Đầu trang: trong suốt để dải lụa của hero lộ ra phía sau; cuộn xuống: nền tối đặc
        navVisible ? "bg-(--sh-home-b)" : "bg-transparent"
      )}
    >
      {/* Trái: Logo */}
      <div className="flex items-center">
        <ShopLogo
          className={cn(
            "hidden h-12 sm:inline-flex [&_img]:transition-all [&_img]:duration-200",
            navVisible ? "[&_img]:h-9" : "[&_img]:h-12"
          )}
        />
        <ShopLogo compact className="sm:hidden" />
      </div>

      {/* Menu loại tài nguyên, nằm sát cụm nút bên phải (chỉ >= lg, ẩn khi ở hero) */}
      <nav
        aria-label="Danh mục chính"
        className={cn(
          "hidden items-center gap-10 pr-6 transition-all duration-200 lg:ml-auto lg:flex",
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
              className="text-[15px] font-medium text-(--sh-fg) transition-colors hover:text-(--sh-pink)"
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
                  className="text-[15px] font-medium text-(--sh-fg)/85 transition-colors hover:text-(--sh-fg)"
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
      <div
        className={cn(
          "ml-auto flex items-center gap-1 sm:gap-2 lg:ml-0",
          // Nút cao 40px, bo 6px, chữ 15px như bản tham chiếu
          "[&_.inline-flex.h-10]:rounded-[6px] [&_.inline-flex.h-10]:px-4 [&_.inline-flex.h-10]:text-[15px]"
        )}
      >
        <ThemeToggleButton />
        <HeaderActions />
        <MobileNav />
      </div>
    </header>
  );
}
