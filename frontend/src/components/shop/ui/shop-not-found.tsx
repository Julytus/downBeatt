import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { ShopButton } from "./shop-button";

/** Trang 404 bên trong khung cửa hàng (LUT / danh mục không tồn tại) */
export function ShopNotFound({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <SearchX className="size-10 text-(--sh-muted)" aria-hidden />
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="max-w-md text-sm text-(--sh-muted)">{description}</p>
      <ShopButton asChild variant="primary" className="mt-2">
        <Link to="/luts">Về kho LUT</Link>
      </ShopButton>
    </div>
  );
}
