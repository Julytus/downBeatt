import { CreditCard } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { useShopDialog } from "@/lib/stores/shop-dialog";

export function MyPlanLoginPrompt() {
  const openDialog = useShopDialog((s) => s.open);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-(--sh-surface) text-(--sh-muted)">
        <CreditCard className="size-7 stroke-[1.5]" aria-hidden />
      </div>
      <h1 className="font-display text-2xl font-bold md:text-3xl">
        Đăng nhập để xem gói của bạn
      </h1>
      <p className="max-w-md text-sm text-(--sh-muted)">
        Gói đang dùng và lịch sử mua gói gắn với tài khoản của bạn.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <ShopButton
          variant="primary"
          onClick={() => openDialog({ type: "login" })}
        >
          Đăng nhập
        </ShopButton>
        <ShopButton
          variant="secondary"
          onClick={() => openDialog({ type: "register" })}
        >
          Tạo tài khoản
        </ShopButton>
      </div>
    </div>
  );
}
