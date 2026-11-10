import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { FeatureBar } from "@/components/admin/lut/feature-bar";
import { FEATURE_ROWS } from "@/lib/lut-feature/feature-rows";
import type { LutColorFeatureDTO } from "@/lib/types/lut-feature";

export interface LutColorFeatureCardProps {
  feature: LutColorFeatureDTO;
  className?: string;
}

export function LutColorFeatureCard({ feature, className }: LutColorFeatureCardProps) {
  const isMono = feature.isMono === 1;
  const rows = isMono ? FEATURE_ROWS.slice(0, 3) : FEATURE_ROWS;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Đặc trưng màu</CardTitle>
          {isMono && <Badge variant="secondary">Đen trắng</Badge>}
        </div>
        <CardDescription>Đo từ file .cube, so với ảnh gốc</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="divide-y divide-border/50">
          {rows.map((row) => (
            <FeatureBar key={row.key} row={row} value={feature[row.key]} />
          ))}
        </div>
        {isMono && (
          <p className="text-xs text-muted-foreground pt-2">
            LUT đen trắng: các thanh dịch màu không có ý nghĩa nên được ẩn.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
