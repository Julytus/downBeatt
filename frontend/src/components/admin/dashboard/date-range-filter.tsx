import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DashboardGroupBy } from "@/lib/types/dashboard";
import { formatDateDMY } from "./format";

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getToday(): string {
  return formatLocalDate(new Date());
}

export function addDays(dayStr: string, n: number): string {
  const [y, m, d] = dayStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + n);
  const yOut = date.getUTCFullYear();
  const mOut = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dOut = String(date.getUTCDate()).padStart(2, "0");
  return `${yOut}-${mOut}-${dOut}`;
}

export function diffDays(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const ms1 = Date.UTC(y1, m1 - 1, d1);
  const ms2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((ms2 - ms1) / (1000 * 3600 * 24)) + 1;
}

const QUICK_OPTIONS = [
  { label: "7 ngày", minusDays: 6, groupBy: "DAY" as const },
  { label: "30 ngày", minusDays: 29, groupBy: "DAY" as const },
  { label: "90 ngày", minusDays: 89, groupBy: "DAY" as const },
  { label: "12 tháng", minusDays: 364, groupBy: "MONTH" as const }
];

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  selectedQuick: string | null;
  previousFrom?: string;
  previousTo?: string;
  onRangeChange: (from: string, to: string, groupBy: DashboardGroupBy, quick: string | null) => void;
}

export function DateRangeFilter({
  fromDate,
  toDate,
  selectedQuick,
  previousFrom,
  previousTo,
  onRangeChange
}: DateRangeFilterProps) {
  const [fromInput, setFromInput] = React.useState(fromDate);
  const [toInput, setToInput] = React.useState(toDate);

  // Synchronize inputs when props change from external updates
  React.useEffect(() => {
    setFromInput(fromDate);
  }, [fromDate]);

  React.useEffect(() => {
    setToInput(toDate);
  }, [toDate]);

  const fromError = React.useMemo(() => {
    if (!fromInput.trim()) {
      return "Chọn ngày";
    }
    return null;
  }, [fromInput]);

  const toError = React.useMemo(() => {
    if (!toInput.trim()) {
      return "Chọn ngày";
    }
    if (fromInput.trim()) {
      if (fromInput > toInput) {
        return "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc";
      }
      if (diffDays(fromInput, toInput) > 366) {
        return "Khoảng thời gian tối đa 366 ngày";
      }
    }
    return null;
  }, [fromInput, toInput]);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFromInput(val);
    if (!val.trim()) return;

    if (toInput.trim()) {
      if (val > toInput) return;
      const count = diffDays(val, toInput);
      if (count > 366) return;
      const autoGroupBy: DashboardGroupBy = count <= 92 ? "DAY" : "MONTH";
      onRangeChange(val, toInput, autoGroupBy, null);
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setToInput(val);
    if (!val.trim()) return;

    if (fromInput.trim()) {
      if (fromInput > val) return;
      const count = diffDays(fromInput, val);
      if (count > 366) return;
      const autoGroupBy: DashboardGroupBy = count <= 92 ? "DAY" : "MONTH";
      onRangeChange(fromInput, val, autoGroupBy, null);
    }
  };

  const handleQuick = (opt: (typeof QUICK_OPTIONS)[number]) => {
    const today = getToday();
    const newFrom = addDays(today, -opt.minusDays);
    const newTo = today;
    setFromInput(newFrom);
    setToInput(newTo);
    onRangeChange(newFrom, newTo, opt.groupBy, opt.label);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {QUICK_OPTIONS.map((opt) => {
            const isPressed = selectedQuick === opt.label;
            return (
              <Button
                key={opt.label}
                type="button"
                size="sm"
                variant={isPressed ? "default" : "outline"}
                aria-pressed={isPressed ? "true" : "false"}
                onClick={() => handleQuick(opt)}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <div className="space-y-1">
            <Label htmlFor="dashboard-from-date">Từ ngày</Label>
            <Input
              id="dashboard-from-date"
              type="date"
              value={fromInput}
              onChange={handleFromChange}
              className="w-40"
              aria-invalid={!!fromError}
            />
            {fromError && <p className="text-destructive text-xs">{fromError}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="dashboard-to-date">Đến ngày</Label>
            <Input
              id="dashboard-to-date"
              type="date"
              value={toInput}
              onChange={handleToChange}
              className="w-40"
              aria-invalid={!!toError}
            />
            {toError && <p className="text-destructive text-xs">{toError}</p>}
          </div>
        </div>
      </div>

      {previousFrom && previousTo && (
        <p className="text-muted-foreground text-xs">
          So sánh với kỳ trước: {formatDateDMY(previousFrom)} – {formatDateDMY(previousTo)}
        </p>
      )}
    </div>
  );
}
