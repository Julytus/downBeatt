import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  CreditCard,
  FolderHeart,
  History,
  LogOut,
  Palette,
  RefreshCcw,
  Sparkles,
  Star
} from "lucide-react";
import { useState } from "react";
import { ClearHistoryDialog } from "@/components/shop/account/clear-history-dialog";
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
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { useShopSession } from "@/lib/stores/shop-session";
import { logoutMutationOptions } from "@/lib/tanstack/options/account";
import { plansQueryOptions } from "@/lib/tanstack/options/billing";
import { daysLeft, formatPlanDate } from "@/lib/utils/plan";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** Cụm nút bên phải header: chưa đăng nhập → Bảng giá / Đăng ký / Đăng nhập; đã đăng nhập → menu tài khoản (plan §6.5). */
export function HeaderActions({ hidePricing = false }: { hidePricing?: boolean }) {
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const user = useShopSession((s) => s.user);
  const loading = useShopSession((s) => s.loading);
  const openDialog = useShopDialog((s) => s.open);
  const logoutMutation = useMutation(logoutMutationOptions);
  const { data: plans } = useQuery(plansQueryOptions);

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

  const plan =
    plans?.find((p) => p.code === user.plan) ?? {
      name: user.plan === "studio" ? "Studio" : user.plan === "pro" ? "Pro" : "Miễn phí"
    };

  const isCancelled = user.planAutoRenew === 0;
  const days = user.planExpiresAt ? daysLeft(user.planExpiresAt) : undefined;
  const isExpiringSoon = !isCancelled && user.plan !== "free" && user.planExpiresAt && days !== undefined && days <= 3;

  return (
    <div className="flex shrink-0 items-center gap-2">
      {pricing}
      {/* modal=false: không ẩn (aria-hidden) phần còn lại của trang khi mở menu */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          {/* Tên đọc = chữ đang hiện ("Tài khoản " + tên), không dùng aria-label khác chữ (WCAG 2.5.3) */}
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
              Gói <b>{plan.name}</b>
              {user.planExpiresAt && (
                <span className="block text-xs text-(--sh-muted)">
                  {isCancelled
                    ? `Dùng đến ${formatPlanDate(user.planExpiresAt)}`
                    : `Hết hạn ${formatPlanDate(user.planExpiresAt)}`}
                </span>
              )}
              {isCancelled && (
                <span className="block text-xs text-(--sh-muted)">
                  Đã huỷ gia hạn
                </span>
              )}
              {isExpiringSoon && (
                <span className="block text-xs font-semibold text-amber-500">
                  {days === 0 ? "Hết hạn hôm nay" : `Còn ${days} ngày`}
                </span>
              )}
            </span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/goi-cua-toi">
              <CreditCard /> Gói của tôi
            </Link>
          </DropdownMenuItem>
          {isExpiringSoon && (
            <DropdownMenuItem asChild>
              <Link to="/pricing">
                <RefreshCcw /> Gia hạn gói
              </Link>
            </DropdownMenuItem>
          )}
          {user.plan === "pro" && (
            <DropdownMenuItem asChild>
              <Link to="/pricing">
                <Sparkles /> Nâng cấp lên Studio
              </Link>
            </DropdownMenuItem>
          )}
          {user.plan === "free" && (
            <DropdownMenuItem asChild>
              <Link to="/pricing">
                <Sparkles /> Nâng cấp lên Pro
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/bo-suu-tap">
              <FolderHeart /> Bộ sưu tập của tôi
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openDialog({ type: "preference", mode: "edit" })}>
            <Palette /> Sở thích màu
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setClearHistoryOpen(true)}>
            <History /> Xoá lịch sử gợi ý
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => logoutMutation.mutate()}>
            <LogOut /> Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ClearHistoryDialog open={clearHistoryOpen} onOpenChange={setClearHistoryOpen} />
    </div>
  );
}
