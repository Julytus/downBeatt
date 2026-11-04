import { ShopLogo } from "@/components/shop/layout/shop-logo";
import { HeaderActions } from "./header-actions";
import { HeaderSearch } from "./header-search";
import { MobileNav } from "./mobile-nav";

export function ShopHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-(--sh-bg) px-4 py-2.5 md:px-12">
      <MobileNav />
      <ShopLogo className="lg:hidden" />
      <HeaderSearch className="hidden max-w-[572px] md:flex" />
      <div className="ml-auto">
        <HeaderActions />
      </div>
    </header>
  );
}
