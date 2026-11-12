import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivePlansDTO } from "@/lib/types/dashboard";
import { formatCount, formatPercent } from "./format";

interface ActivePlansCardProps {
  activePlans: ActivePlansDTO;
}

export function ActivePlansCard({ activePlans }: ActivePlansCardProps) {
  const total = activePlans.totalCustomers;
  const isEmpty = total === 0;

  return (
    <section aria-label="Gói đang dùng">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Gói đang dùng</CardTitle>
          <CardDescription>Tính tại thời điểm xem, không theo khoảng ngày.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="text-sm font-medium">Tổng {formatCount(total)} khách hàng</div>
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">Chưa có khách hàng nào.</p>
          ) : (
            <ul aria-label="Gói đang dùng" className="space-y-3">
              {activePlans.items.map((item) => {
                const ratio = total === 0 ? 0 : item.customers / total;
                const pctFormatted = formatPercent(ratio);
                const pctWidth = Math.min(100, Math.max(0, ratio * 100));

                return (
                  <li key={item.planCode} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.planName}</span>
                      <span className="text-muted-foreground">
                        {formatCount(item.customers)}{" "}
                        <span className="text-xs">({pctFormatted})</span>
                      </span>
                    </div>
                    <div aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full bg-muted">
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
