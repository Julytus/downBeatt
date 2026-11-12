import type { PositionStatDTO } from "@/lib/types/recommend";
import { formatVnPercent } from "./labels";

export interface PositionBarsProps {
  items: PositionStatDTO[];
}

export function PositionBars({ items }: PositionBarsProps) {
  const maxCtr = Math.max(...items.map((i) => i.ctr), 0.0001);

  return (
    <ul aria-label="CTR theo vị trí" className="space-y-3">
      {items.map((item) => {
        const pctWidth = Math.min(100, Math.max(0, (item.ctr / maxCtr) * 100));
        return (
          <li
            key={item.position}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm"
          >
            <span className="w-20 font-medium flex-shrink-0">Vị trí {item.position}</span>
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div
                aria-hidden="true"
                className="h-2 flex-1 rounded-full bg-muted overflow-hidden"
              >
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${pctWidth}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatVnPercent(item.ctr)} ({item.clicks}/{item.impressions})
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
