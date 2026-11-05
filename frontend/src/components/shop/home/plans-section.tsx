import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PlanCard } from "@/components/shop/pricing/plan-card";
import { usePlanSelect } from "@/components/shop/pricing/use-plan-select";
import { Skeleton } from "@/components/ui/skeleton";
import { plansQueryOptions } from "@/lib/tanstack/options/account";

export function PlansSection() {
  const { data: plans, isPending } = useQuery(plansQueryOptions);
  const { select, ctaLabel, user } = usePlanSelect("month");

  return (
    <section
      aria-labelledby="plans-title"
      className="bg-(--sh-home-b) px-4 py-16 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1280px]">
        <h2
          id="plans-title"
          className="font-display text-3xl leading-[1.1] font-bold text-(--sh-fg) md:text-5xl"
        >
          <span className="block">Gói cho mọi kiểu</span>
          <span className="block">nhà sáng tạo</span>
        </h2>

        {/* 3 gói rút gọn cố định theo tháng */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {isPending || !plans
            ? Array.from({ length: 3 }, (_, i) => (
                <Skeleton
                  key={i}
                  className="h-[520px] rounded-[12px] bg-(--sh-surface)"
                />
              ))
            : plans.map((p) => (
                <PlanCard
                  key={p.code}
                  plan={p}
                  cycle="month"
                  current={!!user && user.plan === p.code}
                  ctaLabel={ctaLabel(p)}
                  onSelect={() => select(p)}
                  home
                />
              ))}
        </div>

        {/* Link so sánh */}
        <div className="mt-10 text-center">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--sh-primary) hover:underline md:text-base"
          >
            So sánh chi tiết các gói <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
