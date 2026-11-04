import "@/components/shop/shop-theme.css";
import { ShopDialogs } from "@/components/shop/account/shop-dialogs";
import { cn } from "@/lib/utils";
import { RouteProgress } from "./route-progress";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Space+Grotesk:wght@500;600;700&family=Playfair+Display:ital,wght@1,500&display=swap";

/**
 * Phần chung của mọi layout cửa hàng: token màu (.shop), font, link "Bỏ qua menu",
 * thanh tiến trình chuyển trang và các hộp thoại tài khoản.
 */
export function ShopShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("shop min-h-full shrink-0 bg-(--sh-bg) text-(--sh-fg)", className)}>
      {/* React 19 tự đưa các thẻ này lên <head> */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS_HREF} precedence="default" />

      <a
        href="#shop-main"
        className="sr-only z-50 rounded-[8px] bg-(--sh-primary) px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Bỏ qua menu
      </a>
      <RouteProgress />
      {children}
      <ShopDialogs />
    </div>
  );
}
