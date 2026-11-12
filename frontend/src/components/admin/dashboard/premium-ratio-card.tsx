import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTotalsDTO } from "@/lib/types/dashboard";
import { formatCount, formatPercent } from "./format";

interface PremiumRatioCardProps {
  summary: DashboardTotalsDTO;
}

export function PremiumRatioCard({ summary }: PremiumRatioCardProps) {
  const isEmpty = summary.downloads === 0;
  const regularDownloads = summary.downloads - summary.premiumDownloads;
  const premiumPct = isEmpty ? 0 : (summary.premiumDownloads / summary.downloads) * 100;
  const regularPct = isEmpty ? 0 : (regularDownloads / summary.downloads) * 100;

  return (
    <section aria-label="Lượt tải Premium">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Lượt tải Premium</CardTitle>
          <CardDescription>Tỉ lệ lượt tải là LUT Premium trong khoảng ngày.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              Chưa có lượt tải nào trong khoảng này.
            </p>
          ) : (
            <>
              <div>
                <div className="text-3xl font-bold tracking-tight">
                  {formatPercent(summary.premiumRatio)}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCount(summary.premiumDownloads)} / {formatCount(summary.downloads)} lượt tải là LUT Premium
                </p>
              </div>

              <div
                aria-hidden="true"
                className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${premiumPct}%` }}
                />
                <div
                  className="h-full bg-muted-foreground/30 transition-all"
                  style={{ width: `${regularPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
                  <span>Premium: {formatCount(summary.premiumDownloads)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Thường: {formatCount(regularDownloads)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
