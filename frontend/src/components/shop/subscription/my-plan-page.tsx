import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopSession } from "@/lib/stores/shop-session";
import { CurrentPlanCard } from "./current-plan-card";
import { MyPlanLoginPrompt } from "./my-plan-login-prompt";
import { OrderHistoryTable } from "./order-history-table";

export function MyPlanPage() {
  const user = useShopSession((s) => s.user);
  const loading = useShopSession((s) => s.loading);

  useEffect(() => {
    document.title = "Gói của tôi | DownBeat";
  }, []);

  if (loading && !user) {
    return (
      <div className="mx-auto max-w-[1080px] space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-[6px] bg-(--sh-surface)" />
          <Skeleton className="h-4 w-72 rounded-[4px] bg-(--sh-surface)" />
        </div>
        <Skeleton className="h-64 w-full rounded-[12px] bg-(--sh-surface)" />
        <Skeleton className="h-64 w-full rounded-[12px] bg-(--sh-surface)" />
      </div>
    );
  }

  if (!user) {
    return <MyPlanLoginPrompt />;
  }

  return (
    <div className="mx-auto max-w-[1080px] space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-[-0.5px] text-(--sh-fg) md:text-3xl">
          Gói của tôi
        </h1>
        <p className="mt-1 text-sm text-(--sh-muted)">
          Quản lý gói đang dùng và xem lại các đơn đã mua.
        </p>
      </header>

      <CurrentPlanCard />
      <OrderHistoryTable />
    </div>
  );
}
