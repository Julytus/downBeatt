import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, QrCode } from "lucide-react";
import { useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopSession } from "@/lib/stores/shop-session";
import { createOrderMutationOptions, plansQueryOptions } from "@/lib/tanstack/options/billing";
import type { BillingCycle, PlanCode } from "@/lib/types/account";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/utils/money";
import { formatPlanDate } from "@/lib/utils/plan";

interface CheckoutPanelProps {
  plan: Exclude<PlanCode, "free">;
  cycle: BillingCycle;
  sourceLutId?: number;
  onDone: () => void;
}

export function CheckoutPanel({ plan, cycle, sourceLutId }: CheckoutPanelProps) {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(cycle);
  const { data: plans, isPending, isError, refetch } = useQuery(plansQueryOptions);
  const user = useShopSession((s) => s.user);

  const info = plans?.find((p) => p.code === plan);

  const perMonth = info ? (selectedCycle === "year" ? info.yearlyMonthlyPrice : info.monthlyPrice) : 0;
  const total = selectedCycle === "year" ? perMonth * 12 : perMonth;

  const mutation = useMutation({
    ...createOrderMutationOptions,
    onSuccess: (created) => {
      window.location.assign(created.checkoutUrl);
    }
  });

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

  return (
    <div className="flex flex-col gap-5">
      <div
        role="group"
        aria-label="Chu kỳ thanh toán"
        className="inline-flex self-start rounded-full bg-(--sh-surface) p-1 text-sm font-semibold"
      >
        {(["month", "year"] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={selectedCycle === c}
            onClick={() => setSelectedCycle(c)}
            className={cn(
              "h-8 rounded-full px-3.5 transition-colors",
              selectedCycle === c ? "bg-(--sh-elevated) shadow-sm" : "text-(--sh-muted) hover:text-(--sh-fg)"
            )}
          >
            {c === "month" ? "Theo tháng" : "Theo năm"}
            {c === "year" && <span className="ml-1 text-xs text-(--sh-success)">−20%</span>}
          </button>
        ))}
      </div>

      {isPending || !info ? (
        <Skeleton className="h-[154px] w-full rounded-[8px] bg-(--sh-surface)" />
      ) : (
        <dl className="flex flex-col gap-2 rounded-[8px] bg-(--sh-surface) p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-(--sh-muted)">Gói</dt>
            <dd className="font-semibold">{info.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-(--sh-muted)">Chu kỳ</dt>
            <dd>{selectedCycle === "year" ? "Theo năm (12 tháng)" : "Theo tháng"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-(--sh-muted)">Đơn giá</dt>
            <dd>{formatVnd(perMonth)}/tháng</dd>
          </div>
          <div className="mt-1 flex justify-between gap-3 border-t border-(--sh-border) pt-3 text-base">
            <dt className="font-semibold">Tổng thanh toán</dt>
            <dd className="font-bold">{formatVnd(total)}</dd>
          </div>
        </dl>
      )}

      {user && user.plan !== "free" && user.planExpiresAt && info && (
        <p className="text-xs text-(--sh-muted)">
          {user.plan === plan
            ? `Gia hạn thêm một kỳ, nối tiếp ngày ${formatPlanDate(user.planExpiresAt)}.`
            : `Gói ${info.name} có hiệu lực ngay. Thời gian còn lại của gói ${user.plan === "studio" ? "Studio" : "Pro"} được quy đổi thành ngày dùng thêm.`}
        </p>
      )}

      <div className="flex items-start gap-3 rounded-[8px] border border-(--sh-border) p-3 text-sm">
        <QrCode className="mt-0.5 size-5 shrink-0 text-(--sh-pink)" aria-hidden />
        <div>
          <p className="font-semibold">Thanh toán qua payOS</p>
          <p className="mt-0.5 text-(--sh-muted)">
            Bạn sẽ được chuyển sang trang payOS để quét mã VietQR. Gói được kích hoạt ngay khi chuyển khoản thành công.
          </p>
        </div>
      </div>

      <ShopButton
        variant="primary"
        className="w-full"
        disabled={!user || isPending || !info || mutation.isPending}
        onClick={() => {
          if (!user || !info) return;
          mutation.mutate({
            planCode: plan,
            cycle: selectedCycle === "year" ? "YEAR" : "MONTH",
            sourceLutId
          });
        }}
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending
          ? "Đang tạo đơn…"
          : isPending || !info
            ? "Đang tải…"
            : `Thanh toán ${formatVnd(total)}`}
      </ShopButton>
    </div>
  );
}
