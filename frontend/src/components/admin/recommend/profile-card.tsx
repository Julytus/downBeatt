import * as React from "react";
import { ChevronDown } from "lucide-react";
import { FeatureBar } from "@/components/admin/lut/feature-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  FEATURE_ROW_BY_KEY,
  IS_MONO_LABEL,
  type FeatureRowConfig,
  type FeatureRowKey
} from "@/lib/lut-feature/feature-rows";
import type { TryProfileResultDTO } from "@/lib/types/recommend";
import { STRATEGY_LABELS, formatDateTime, formatVnDecimal } from "./labels";

export interface ProfileCardProps {
  data: TryProfileResultDTO;
}

export function ProfileCard({ data }: ProfileCardProps) {
  const [signalsOpen, setSignalsOpen] = React.useState(false);
  const { customer, anonId, strategy, premiumLimited, premiumQuota, profile, color, categoryNames } =
    data;

  return (
    <section aria-label="Hồ sơ" className="w-full min-w-0">
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle>Hồ sơ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header: tên khách hoặc khách vãng lai, kèm strategy badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
            <div>
              {customer ? (
                <>
                  <h3 className="text-lg font-semibold">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">Khách vãng lai</h3>
                  <code className="font-mono text-xs text-muted-foreground">{anonId}</code>
                </>
              )}
            </div>
            <div>
              <Badge variant="outline" className="text-xs">
                {STRATEGY_LABELS[strategy] ?? strategy}
              </Badge>
            </div>
          </div>

          {/* Thông số tổng quan: dl / dt / dd */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm border-b pb-4">
            <dt className="text-muted-foreground">α (tỉ trọng khai báo)</dt>
            <dd className="font-medium text-right sm:text-left">{formatVnDecimal(profile.alpha, 4)}</dd>

            <dt className="text-muted-foreground">Số LUT có tín hiệu dương</dt>
            <dd className="font-medium text-right sm:text-left">{profile.positiveLutCount}</dd>

            <dt className="text-muted-foreground">Sở thích khai báo</dt>
            <dd className="font-medium text-right sm:text-left">
              {profile.preference && profile.preference.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 justify-end sm:justify-start">
                  {profile.preference.map((slug) => (
                    <Badge key={slug} variant="secondary" className="text-xs">
                      {categoryNames[slug] ?? slug}
                    </Badge>
                  ))}
                </div>
              ) : (
                "Không có"
              )}
            </dd>

            <dt className="text-muted-foreground">Giới hạn LUT Premium</dt>
            <dd className="font-medium text-right sm:text-left">
              {premiumLimited ? `Tối đa ${premiumQuota ?? 4} LUT` : "Không giới hạn (gói trả phí)"}
            </dd>
          </dl>

          {/* Ba nhóm chip nổi bật */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
            {/* Phong cách nổi bật */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Phong cách nổi bật</p>
              {profile.topStyles && profile.topStyles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.topStyles.map((st) => (
                    <Badge key={st.key} variant="secondary" className="text-xs">
                      {categoryNames[st.key] ?? st.key} {formatVnDecimal(st.weight, 2)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium">—</p>
              )}
            </div>

            {/* Danh mục nổi bật */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Danh mục nổi bật</p>
              {profile.topCategories && profile.topCategories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.topCategories.map((cat) => (
                    <Badge key={cat.key} variant="secondary" className="text-xs">
                      {categoryNames[cat.key] ?? cat.key} {formatVnDecimal(cat.weight, 2)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium">—</p>
              )}
            </div>

            {/* Thẻ nổi bật */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Thẻ nổi bật</p>
              {profile.topTags && profile.topTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.topTags.map((tag) => (
                    <Badge key={tag.key} variant="secondary" className="text-xs">
                      {tag.key} {formatVnDecimal(tag.weight, 2)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium">—</p>
              )}
            </div>
          </div>

          {/* Màu nổi bật */}
          <div className="space-y-3 border-b pb-4">
            <p className="text-sm font-semibold">Màu nổi bật</p>
            {!color || color.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu màu</p>
            ) : (
              <div className="space-y-1">
                {color.map((item) => {
                  const cfg = FEATURE_ROW_BY_KEY[item.key as FeatureRowKey];
                  const rowConfig: FeatureRowConfig = {
                    key: item.key as FeatureRowKey,
                    label: cfg?.label ?? (item.key === "isMono" ? IS_MONO_LABEL : item.key),
                    left: cfg?.left ?? (item.key === "isMono" ? "Màu" : ""),
                    right: cfg?.right ?? (item.key === "isMono" ? "Đơn sắc" : ""),
                    neutral: 0,
                    span: 3,
                    digits: 2,
                    signed: true
                  };
                  return <FeatureBar key={item.key} row={rowConfig} value={item.value} />;
                })}
              </div>
            )}
          </div>

          {/* Tín hiệu (Collapsible) */}
          <Collapsible open={signalsOpen} onOpenChange={setSignalsOpen} className="space-y-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span>Tín hiệu ({profile.signals?.length ?? 0})</span>
                  <ChevronDown
                    className={`size-4 transition-transform duration-200 ${
                      signalsOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại</TableHead>
                      <TableHead>LUT / giá trị</TableHead>
                      <TableHead className="text-right">Số lần</TableHead>
                      <TableHead className="text-right">Số ngày</TableHead>
                      <TableHead className="text-right">Trọng số</TableHead>
                      <TableHead className="text-right">Lần cuối</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.signals && profile.signals.length > 0 ? (
                      profile.signals.map((sig, idx) => (
                        <TableRow key={`${sig.type}-${sig.lutId ?? sig.value}-${idx}`}>
                          <TableCell className="font-medium">{sig.type}</TableCell>
                          <TableCell>
                            {sig.slug ?? sig.value ?? (sig.lutId ? String(sig.lutId) : "—")}
                          </TableCell>
                          <TableCell className="text-right">{sig.count}</TableCell>
                          <TableCell className="text-right">
                            {sig.days !== undefined ? formatVnDecimal(sig.days, 1) : "—"}
                          </TableCell>
                          <TableCell className="text-right">{formatVnDecimal(sig.weight, 1)}</TableCell>
                          <TableCell className="text-right">
                            {sig.lastTime ? formatDateTime(sig.lastTime) : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Không có tín hiệu
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  );
}
