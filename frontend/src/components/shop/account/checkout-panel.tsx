import { useMutation } from "@tanstack/react-query";
import { Loader2, QrCode } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { MOCK_PLANS } from "@/lib/mock/data/plans";
import { useShopSession } from "@/lib/stores/shop-session";
import { checkoutMutationOptions } from "@/lib/tanstack/options/account";
import type { BillingCycle, PlanCode } from "@/lib/types/account";
import { formatVnd } from "@/lib/utils/money";

interface CheckoutPanelProps {
  plan: Exclude<PlanCode, "free">;
  cycle: BillingCycle;
  onDone: () => void;
}

/**
 * Xác nhận mua gói. Bản thật: tạo đơn → chuyển sang trang thanh toán payOS (VietQR) → payOS gọi webhook
 * và trả về /thanh-toan/ket-qua. Hiện là thanh toán giả lập: bấm là nâng cấp ngay, không trừ tiền.
 */
export function CheckoutPanel({ plan, cycle, onDone }: CheckoutPanelProps) {
  const info = MOCK_PLANS.find((p) => p.code === plan)!;
  const user = useShopSession((s) => s.user);
  const setUser = useShopSession((s) => s.setUser);

  const perMonth = cycle === "year" ? info.yearlyMonthlyPrice : info.monthlyPrice;
  const total = cycle === "year" ? perMonth * 12 : perMonth;

  const mutation = useMutation({
    ...checkoutMutationOptions,
    onSuccess: (updated) => {
      setUser(updated);
      onDone();
    }
  });

  return (
    <div className="flex flex-col gap-5">
      <dl className="flex flex-col gap-2 rounded-[8px] bg-(--sh-surface) p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-(--sh-muted)">Gói</dt>
          <dd className="font-semibold">{info.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-(--sh-muted)">Chu kỳ</dt>
          <dd>{cycle === "year" ? "Theo năm (12 tháng)" : "Theo tháng"}</dd>
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

      <div className="flex items-start gap-3 rounded-[8px] border border-(--sh-border) p-3 text-sm">
        <QrCode className="mt-0.5 size-5 shrink-0 text-(--sh-pink)" aria-hidden />
        <div>
          <p className="font-semibold">Thanh toán qua payOS</p>
          <p className="mt-0.5 text-(--sh-muted)">
            Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ. Gói được kích hoạt ngay khi chuyển khoản thành công.
          </p>
        </div>
      </div>

      <ShopButton
        variant="primary"
        className="w-full"
        disabled={!user || mutation.isPending}
        onClick={() => user && mutation.mutate({ userId: user.id, plan, cycle })}
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? "Đang xử lý…" : `Thanh toán ${formatVnd(total)}`}
      </ShopButton>
      <p className="text-center text-xs text-(--sh-muted)">
        Bản demo: thanh toán giả lập, chưa nối payOS, không trừ tiền thật.
      </p>
    </div>
  );
}
