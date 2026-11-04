import { Check, User, Users } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import type { BillingCycle, PlanDTO } from "@/lib/types/account";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/utils/money";

interface PlanCardProps {
  plan: PlanDTO;
  cycle: BillingCycle;
  /** Gói đang dùng của tài khoản đăng nhập */
  current: boolean;
  ctaLabel: string;
  onSelect: () => void;
}

export function PlanCard({ plan, cycle, current, ctaLabel, onSelect }: PlanCardProps) {
  const price = cycle === "year" ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
  const free = plan.monthlyPrice === 0;
  const Icon = plan.code === "studio" ? Users : User;

  return (
    <article
      aria-labelledby={`plan-${plan.code}`}
      className={cn(
        "relative flex flex-col rounded-[12px] border p-6",
        plan.highlight ? "border-(--sh-primary) shadow-[0_0_0_1px_var(--sh-primary)]" : "border-(--sh-border)",
        plan.code === "studio" && "bg-(--sh-surface)/50"
      )}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-(--sh-primary) px-3 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
          Phổ biến
        </span>
      )}
      <h2 id={`plan-${plan.code}`} className="font-display text-xl font-bold">
        {plan.name}
      </h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-(--sh-muted)">
        <Icon className="size-4" aria-hidden />
        {plan.audience}
      </p>

      <p className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold">{free ? "0đ" : formatVnd(price)}</span>
        {!free && <span className="text-sm text-(--sh-muted)">/tháng</span>}
      </p>
      <p className="mt-1 min-h-5 text-xs text-(--sh-muted)">
        {free
          ? "Không cần thẻ thanh toán"
          : cycle === "year"
            ? `Thanh toán ${formatVnd(price * 12)}/năm, hoặc ${formatVnd(plan.monthlyPrice)}/tháng`
            : `Hoặc ${formatVnd(plan.yearlyMonthlyPrice)}/tháng khi trả theo năm`}
      </p>

      <ShopButton
        variant={plan.highlight ? "primary" : "outline"}
        className="mt-5 w-full"
        disabled={current}
        onClick={onSelect}
      >
        {current ? "Gói hiện tại" : ctaLabel}
      </ShopButton>

      <h3 className="mt-6 text-sm font-semibold">Giấy phép cho</h3>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm">
        {plan.license.map((l) => (
          <li key={l} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-(--sh-success)" aria-hidden />
            {l}
          </li>
        ))}
      </ul>
      <h3 className="mt-5 text-sm font-semibold">Quyền lợi</h3>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-(--sh-success)" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
    </article>
  );
}
