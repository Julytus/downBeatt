import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanRevenueDTO } from "@/lib/types/dashboard";
import { formatCount, formatVnd } from "./format";

interface PlanRevenueCardProps {
  revenueByPlan: PlanRevenueDTO[];
}

export function PlanRevenueCard({ revenueByPlan }: PlanRevenueCardProps) {
  const totalRevenue = revenueByPlan.reduce((acc, p) => acc + p.revenue, 0);
  const isEmpty = revenueByPlan.length === 0 || revenueByPlan.every((p) => p.revenue === 0);

  return (
    <section aria-label="Doanh thu theo gói">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Doanh thu theo gói</CardTitle>
          <CardDescription>Đơn đã thanh toán trong khoảng ngày.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              Chưa có đơn thanh toán nào trong khoảng này.
            </p>
          ) : (
            <ul aria-label="Doanh thu theo gói" className="space-y-3">
              {revenueByPlan.map((p) => {
                const ratio = totalRevenue === 0 ? 0 : p.revenue / totalRevenue;
                const pctWidth = Math.min(100, Math.max(0, ratio * 100));

                return (
                  <li key={p.planCode} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.planName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatVnd(p.revenue)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatCount(p.paidOrders)} đơn
                        </span>
                      </div>
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pctWidth}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
