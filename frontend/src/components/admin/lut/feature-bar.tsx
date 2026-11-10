import * as React from "react";
import {
  featureRatio,
  formatFeatureValue,
  type FeatureRowConfig
} from "@/lib/lut-feature/feature-rows";

export interface FeatureBarProps {
  row: FeatureRowConfig;
  value: number;
  compact?: boolean;
}

export function FeatureBar({ row, value, compact = false }: FeatureBarProps) {
  const formatted = formatFeatureValue(value, row);
  const ratio = featureRatio(value, row);
  const min = row.neutral - row.span;
  const max = row.neutral + row.span;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2"
        title={`${row.left} ← → ${row.right}`}
      >
        <div
          role="meter"
          aria-label={row.label}
          aria-valuetext={formatted}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          className="relative h-1.5 w-14 rounded-full bg-muted overflow-hidden flex-shrink-0"
        >
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 z-10" />
          {ratio !== 0 && (
            <div
              className="absolute top-0 bottom-0 bg-primary rounded-full"
              style={
                ratio > 0
                  ? { left: "50%", width: `${ratio * 50}%` }
                  : { left: `${50 - Math.abs(ratio) * 50}%`, width: `${Math.abs(ratio) * 50}%` }
              }
            />
          )}
        </div>
        <span className="font-mono text-xs font-medium">{formatted}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-1">
      <span className="text-sm font-medium w-36 flex-shrink-0">{row.label}</span>
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">{row.left}</span>
        <div
          role="meter"
          aria-label={row.label}
          aria-valuetext={formatted}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          className="relative h-2 flex-1 rounded-full bg-muted overflow-hidden"
        >
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 z-10" />
          {ratio !== 0 && (
            <div
              className="absolute top-0 bottom-0 bg-primary rounded-full transition-all duration-300"
              style={
                ratio > 0
                  ? { left: "50%", width: `${ratio * 50}%` }
                  : { left: `${50 - Math.abs(ratio) * 50}%`, width: `${Math.abs(ratio) * 50}%` }
              }
            />
          )}
        </div>
        <span className="text-xs text-muted-foreground w-12 text-left flex-shrink-0">{row.right}</span>
      </div>
      <span className="font-mono text-sm font-medium w-14 text-right flex-shrink-0">{formatted}</span>
    </div>
  );
}
