import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown, LogOut, Sparkles, Star } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_PLANS } from "@/lib/mock/data/plans";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { useShopSession } from "@/lib/stores/shop-session";
import { logoutMutationOptions } from "@/lib/tanstack/options/account";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** Cụm nút bên phải header: chưa đăng nhập → Bảng giá / Đăng ký / Đăng nhập; đã đăng nhập → menu tài khoản. */
export function HeaderActions({ hidePricing = false }: { hidePricing?: boolean }) {
  const user = useShopSession((s) => s.user);
  const loading = useShopSession((s) => s.loading);
  const openDialog = useShopDialog((s) => s.open);
  const logoutMutation = useMutation(logoutMutationOptions);

  const pricing = !hidePricing && (
    <ShopButton asChild variant="secondary" className="hidden sm:inline-flex">
      <Link to="/pricing">{user && user.plan === "free" ? "Nâng cấp" : "Bảng giá"}</Link>
    </ShopButton>
  );

  if (loading && !user) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {pricing}
        <Skeleton
          role="status"
          aria-label="Đang tải tài khoản"
          className="size-8 rounded-full bg-(--sh-surface)"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {pricing}
        <ShopButton variant="primary" onClick={() => openDialog({ type: "register" })}>
          Đăng ký
        </ShopButton>
        <ShopButton variant="secondary" onClick={() => openDialog({ type: "login" })}>
          Đăng nhập
        </ShopButton>
      </div>
    );
  }

  const plan = MOCK_PLANS.find((p) => p.code === user.plan);

  return (
    <div className="flex shrink-0 items-center gap-2">
      {pricing}
      {/* modal=false: không ẩn (aria-hidden) phần còn lại của trang khi mở menu */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          {/* Tên đọc = chữ đang hiện ("Tài khoản" + tên), không dùng aria-label khác chữ (WCAG 2.5.3) */}
          <ShopButton variant="ghost" className="gap-2 pr-2 pl-1.5">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-(--sh-primary) text-xs font-bold text-white"
            >
              {initials(user.name)}
            </span>
            <span className="sr-only">Tài khoản </span>
            <span className="sr-only max-w-32 truncate md:not-sr-only">{user.name}</span>
            <ChevronDown className="size-4" />
          </ShopButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="shop w-64 border-(--sh-border) bg-(--sh-elevated) text-(--sh-fg)">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate">{user.name}</span>
            <span className="truncate text-xs font-normal text-(--sh-muted)">{user.email}</span>
          </DropdownMenuLabel>
          <div className="mx-2 mb-2 flex items-center gap-2 rounded-[8px] bg-(--sh-surface) px-2.5 py-2 text-sm">
            <Star className="size-4 text-(--sh-pink)" aria-hidden />
            <span>
              Gói <b>{plan?.name}</b>
              {user.planExpiresAt && (
                <span className="block text-xs text-(--sh-muted)">
                  Hết hạn {new Date(user.planExpiresAt).toLocaleDateString("vi-VN")}
                </span>
              )}
            </span>
          </div>
          <DropdownMenuSeparator />
          {user.plan === "free" && (
            <DropdownMenuItem asChild>
              <Link to="/pricing">
                <Sparkles /> Nâng cấp lên Pro
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => logoutMutation.mutate()}
          >
            <LogOut /> Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
