import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { plansQueryOptions } from "@/lib/tanstack/options/billing";
import type { LutDTO } from "@/lib/types/lut";
import { formatVnd } from "@/lib/utils/money";

interface UpgradePanelProps {
  lut?: LutDTO;
  onClose: () => void;
}

/** Nội dung hộp thoại khi tài khoản Miễn phí bấm tải LUT Premium (plan §6.3). */
export function UpgradePanel({ lut, onClose }: UpgradePanelProps) {
  const { data: plans, isPending, isError, refetch } = useQuery(plansQueryOptions);
  const openDialog = useShopDialog((s) => s.open);

  const pro = plans?.find((p) => p.code === "pro");

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-semibold text-destructive">Không tải được bảng giá</p>
        <ShopButton variant="secondary" onClick={() => void refetch()}>
          Thử lại
        </ShopButton>
      </div>
    );
  }

  if (isPending || !pro) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full bg-(--sh-surface)" />
          ))}
        </div>
        <Skeleton className="h-5 w-3/4 bg-(--sh-surface)" />
        <div className="flex flex-col gap-2">
          <ShopButton variant="primary" className="w-full" disabled>
            Mua gói Pro
          </ShopButton>
          <div className="flex gap-2">
            <ShopButton asChild variant="outline" className="flex-1">
              <Link to="/pricing" onClick={onClose}>
                Xem bảng giá
              </Link>
            </ShopButton>
            <ShopButton variant="secondary" onClick={onClose} className="flex-1">
              Để sau
            </ShopButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2 text-sm">
        {pro.features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-(--sh-success)" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <p className="text-sm text-(--sh-muted)">
        Gói Pro chỉ từ <b className="text-(--sh-fg)">{formatVnd(pro.yearlyMonthlyPrice)}/tháng</b> khi trả theo năm.
        Huỷ bất cứ lúc nào.
      </p>
      <div className="flex flex-col gap-2">
        <ShopButton
          variant="primary"
          className="w-full"
          onClick={() => openDialog({ type: "checkout", plan: "pro", cycle: "year", sourceLutId: lut?.id })}
        >
          Mua gói Pro
        </ShopButton>
        <div className="flex gap-2">
          <ShopButton asChild variant="outline" className="flex-1">
            <Link to="/pricing" onClick={onClose}>
              Xem bảng giá
            </Link>
          </ShopButton>
          <ShopButton variant="secondary" onClick={onClose} className="flex-1">
            Để sau
          </ShopButton>
        </div>
      </div>
    </div>
  );
}
