import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTotalsDTO } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";
import { formatCount, formatVnd, getComparison } from "./format";

interface KpiTilesProps {
  summary: DashboardTotalsDTO;
  previous: DashboardTotalsDTO;
}

export function KpiTiles({ summary, previous }: KpiTilesProps) {
  const tiles = [
    {
      title: "Doanh thu",
      value: formatVnd(summary.revenue),
      comparison: getComparison(summary.revenue, previous.revenue)
    },
    {
      title: "Đơn đã thanh toán",
      value: formatCount(summary.paidOrders),
      comparison: getComparison(summary.paidOrders, previous.paidOrders)
    },
    {
      title: "Khách mới",
      value: formatCount(summary.newCustomers),
      comparison: getComparison(summary.newCustomers, previous.newCustomers)
    },
    {
      title: "Lượt tải",
      value: formatCount(summary.downloads),
      comparison: getComparison(summary.downloads, previous.downloads)
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((item) => (
        <Card key={item.title} aria-label={item.title}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight">{item.value}</div>
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                item.comparison.type === "positive" && "text-emerald-600 dark:text-emerald-400",
                item.comparison.type === "negative" && "text-destructive",
                item.comparison.type === "neutral" && "text-muted-foreground"
              )}
            >
              {item.comparison.text}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
