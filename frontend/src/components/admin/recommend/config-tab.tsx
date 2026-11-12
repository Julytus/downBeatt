import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { recommendConfigQueryOptions } from "@/lib/tanstack/options/recommend-admin";
import type { IndexStatusDTO } from "@/lib/types/recommend";
import {
  BLOCK_KEYS,
  BLOCK_LABELS,
  EVENT_KEYS,
  EVENT_LABELS,
  PARAM_KEYS,
  PARAM_LABELS,
  formatDateTime,
  formatParamValue,
  formatVnDecimal
} from "./labels";
import { TabLoadError } from "./tab-load-error";

export function ConfigTab() {
  const { data: config, isLoading, isError, refetch } = useQuery(recommendConfigQueryOptions);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !config) {
    return <TabLoadError onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Chỉ xem. Giá trị lấy từ application.yml (khoá recommend.*); muốn đổi thì sửa file và khởi động lại backend.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Chỉ mục */}
        <IndexCard index={config.index} />

        {/* 2. Trọng số khối */}
        <BlockWeightsCard
          weights={config.weights}
          normalizedWeights={config.normalizedWeights}
        />

        {/* 3. Trọng số sự kiện */}
        <EventWeightsCard eventWeights={config.eventWeights} />

        {/* 4. Tham số */}
        <ParamsCard params={config.params} variant={config.variant} />
      </div>
    </div>
  );
}

function IndexCard({ index }: { index?: IndexStatusDTO }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chỉ mục</CardTitle>
      </CardHeader>
      <CardContent>
        {index ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Số LUT trong chỉ mục</dt>
            <dd className="font-medium text-right sm:text-left">{index.lutCount ?? 0}</dd>

            <dt className="text-muted-foreground">Số cặp tương tự</dt>
            <dd className="font-medium text-right sm:text-left">{index.similarityRows ?? 0}</dd>

            <dt className="text-muted-foreground">Dựng lúc</dt>
            <dd className="font-medium text-right sm:text-left">{formatDateTime(index.builtTime)}</dd>

            <dt className="text-muted-foreground">Lý do</dt>
            <dd className="font-medium text-right sm:text-left">{index.reason ?? "—"}</dd>

            <dt className="text-muted-foreground">Thời gian dựng</dt>
            <dd className="font-medium text-right sm:text-left">
              {index.elapsedMs !== undefined ? `${index.elapsedMs} ms` : "—"}
            </dd>

            {index.lastError && (
              <div className="col-span-2 mt-2 text-xs text-destructive">
                Lần dựng gần nhất lỗi lúc {formatDateTime(index.lastErrorTime)}: {index.lastError}
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Chỉ mục chưa được dựng</p>
        )}
      </CardContent>
    </Card>
  );
}

function BlockWeightsCard({
  weights,
  normalizedWeights
}: {
  weights: Record<string, number>;
  normalizedWeights: Record<string, number>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trọng số khối</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khối</TableHead>
              <TableHead className="w-24 text-right sm:text-left">Cấu hình</TableHead>
              <TableHead className="w-48 text-right sm:text-left">Sau chuẩn hoá</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BLOCK_KEYS.map((key) => {
              const raw = weights[key] ?? 0;
              const norm = normalizedWeights[key] ?? 0;
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{BLOCK_LABELS[key]}</TableCell>
                  <TableCell className="text-right sm:text-left">{formatVnDecimal(raw, 2)}</TableCell>
                  <TableCell className="text-right sm:text-left">
                    <div className="flex items-center gap-2 justify-end sm:justify-start">
                      <div
                        aria-hidden="true"
                        className="h-2 w-16 rounded-full bg-muted overflow-hidden flex-shrink-0"
                      >
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, norm * 100))}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{formatVnDecimal(norm, 2)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EventWeightsCard({ eventWeights }: { eventWeights: Record<string, number> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trọng số sự kiện</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sự kiện</TableHead>
              <TableHead className="w-28 text-right sm:text-left">Trọng số</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EVENT_KEYS.map((key) => {
              const val = eventWeights[key] ?? 0;
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{EVENT_LABELS[key]}</TableCell>
                  <TableCell className="text-right sm:text-left">
                    {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(val)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ParamsCard({
  params,
  variant
}: {
  params: Record<string, number | string>;
  variant: string;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Tham số</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tham số</TableHead>
              <TableHead>Khoá</TableHead>
              <TableHead className="text-right sm:text-left">Giá trị</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PARAM_KEYS.map((key) => {
              const val = params[key];
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{PARAM_LABELS[key]}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{key}</code>
                  </TableCell>
                  <TableCell className="text-right sm:text-left">
                    {val !== undefined ? formatParamValue(val) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="mt-4 px-2 sm:px-0 text-sm text-muted-foreground">
          Biến thể đang chạy: {variant}
        </div>
      </CardContent>
    </Card>
  );
}
