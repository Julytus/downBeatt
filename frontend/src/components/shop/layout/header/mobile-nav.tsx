import { Menu } from "lucide-react";
import { useState } from "react";
import { ShopSidebar } from "@/components/shop/layout/sidebar/shop-sidebar";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Nút ☰ + menu trượt từ trái, chỉ hiện dưới breakpoint lg. Tự đóng khi chọn một mục. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <ShopButton variant="ghost" size="icon-square" aria-label="Mở menu" className="lg:hidden">
          <Menu />
        </ShopButton>
      </SheetTrigger>
      <SheetContent side="left" className="shop w-60 gap-0 border-r-0 bg-(--sh-bg) p-0 text-(--sh-fg)">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Danh mục của DownBeat</SheetDescription>
        <ShopSidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
