import { Link } from "@tanstack/react-router";
import { Check, User, Users } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Badge } from "@/components/ui/badge";
import type { BillingCycle, PlanDTO, ShopUserDTO } from "@/lib/types/account";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/utils/money";
import { planAction } from "@/lib/utils/plan";

interface PlanCardProps {
  plan: PlanDTO;
  cycle: BillingCycle;
  user?: ShopUserDTO | null;
  onSelect: () => void;
  /** Kiểu thẻ ở trang chủ: phần đầu tô nền, nút trắng, góc vuông hơn */
  home?: boolean;
}

export function PlanCard({
  plan,
  cycle,
  user,
  onSelect,
  home = false
}: PlanCardProps) {
  const price = cycle === "year" ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
  const free = plan.monthlyPrice === 0;
  const Icon = plan.code === "studio" ? Users : User;
  const checkClass = !home
    ? "text-(--sh-success)"
    : plan.code === "studio"
      ? "text-sky-600 dark:text-sky-300"
      : "text-(--sh-pink)";

  const action = planAction(user, plan);
  const isHighlight = Boolean(plan.isHighlight);

  return (
    <article
      id={`plan-${plan.code}`}
      aria-labelledby={`plan-heading-${plan.code}`}
      className={cn(
        "relative flex flex-col border",
        home ? "rounded-[4px]" : "rounded-[12px] p-6",
        isHighlight
          ? "border-(--sh-primary) shadow-[0_0_0_1px_var(--sh-primary)]"
          : home
            ? "border-(--sh-border) dark:border-transparent"
            : "border-(--sh-border)",
        !home && plan.code === "studio" && "bg-(--sh-surface)/50"
      )}
    >
      {isHighlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-(--sh-primary) px-3 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
          Phổ biến
        </span>
      )}
      {action.isCurrent && (
        <Badge
          variant="outline"
          className="absolute -top-3 right-4 rounded-full border-(--sh-border) bg-(--sh-elevated) px-2.5 py-0.5 text-xs font-semibold text-(--sh-fg)"
        >
          Gói hiện tại
        </Badge>
      )}
      <div
        className={cn(
          home && "rounded-t-[4px] px-5 pt-7 pb-8",
          home &&
            (plan.code === "studio"
              ? "bg-(--sh-surface)/60 dark:bg-[#1e2b3d]"
              : "bg-(--sh-surface)/40 dark:bg-[#241a20]")
        )}
      >
        <h2
          id={`plan-heading-${plan.code}`}
          className={cn(home ? "text-2xl font-semibold" : "font-display text-xl font-bold")}
        >
          {plan.name}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-(--sh-muted)">
          <Icon className="size-4" aria-hidden />
          {plan.audience}
        </p>

        <p className="mt-5 flex items-baseline gap-1">
          <span className={cn("font-display font-bold", home ? "text-5xl" : "text-4xl")}>
            {free ? "0đ" : formatVnd(price)}
          </span>
          {!free && <span className="text-sm text-(--sh-muted)">/tháng</span>}
        </p>
        <p className="mt-1 min-h-5 text-xs text-(--sh-muted)">
          {free
            ? "Không cần thẻ thanh toán"
            : cycle === "year"
              ? `Thanh toán ${formatVnd(price * 12)} mỗi năm`
              : `Hoặc ${formatVnd(plan.yearlyMonthlyPrice)}/tháng khi trả theo năm`}
        </p>

        {action.isLink && action.href ? (
          <ShopButton
            asChild
            variant={isHighlight ? "primary" : "outline"}
            className={cn(
              "mt-5 w-full",
              home && "h-11 rounded-[4px] text-base",
              home &&
                !isHighlight &&
                "border-(--sh-border) bg-white text-[#151a20] hover:bg-white/90 dark:border-transparent"
            )}
          >
            <Link to={action.href}>{action.label}</Link>
          </ShopButton>
        ) : (
          <ShopButton
            variant={isHighlight ? "primary" : "outline"}
            className={cn(
              "mt-5 w-full",
              home && "h-11 rounded-[4px] text-base",
              home &&
                !isHighlight &&
                "border-(--sh-border) bg-white text-[#151a20] hover:bg-white/90 dark:border-transparent"
            )}
            disabled={action.disabled}
            onClick={onSelect}
          >
            {action.label}
          </ShopButton>
        )}
      </div>

      <div className={cn(home && "px-5 pt-2 pb-7")}>
        <h3 className="mt-6 text-sm font-semibold">Giấy phép cho</h3>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm">
          {plan.license.map((l) => (
            <li key={l} className="flex gap-2">
              <Check className={cn("mt-0.5 size-4 shrink-0", checkClass)} aria-hidden />
              {l}
            </li>
          ))}
        </ul>
        <h3 className="mt-5 text-sm font-semibold">Quyền lợi</h3>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className={cn("mt-0.5 size-4 shrink-0", checkClass)} aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
