import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { BlockKey, RecommendStrategy, TryProfileLutDTO } from "@/lib/types/recommend";
import { cn } from "@/lib/utils";
import { BLOCK_KEYS, formatVnDecimal } from "./labels";

export interface TryItemsTableProps {
  items: TryProfileLutDTO[];
  strategy: RecommendStrategy;
  categoryNames: Record<string, string>;
}

export function TryItemsTable({ items, strategy, categoryNames }: TryItemsTableProps) {
  const isPopular = strategy === "POPULAR";

  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>{items.length} gợi ý</CardTitle>
      </CardHeader>
      <CardContent className="w-full min-w-0">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Không có LUT nào để gợi ý.
          </p>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto rounded-md border">
            <Table aria-label="Gợi ý thử">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="min-w-[200px]">LUT</TableHead>
                  <TableHead className="w-24 text-right">Điểm</TableHead>
                  <TableHead className="w-20 text-right">Thẻ</TableHead>
                  <TableHead className="w-20 text-right">Màu</TableHead>
                  <TableHead className="w-20 text-right">Danh mục</TableHead>
                  <TableHead className="w-20 text-right">Phong cách</TableHead>
                  <TableHead className="w-20 text-right">Văn bản</TableHead>
                  <TableHead className="w-20 text-right">Tác giả</TableHead>
                  <TableHead className="min-w-[220px]">Câu giải thích</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
                  let maxVal = -Infinity;
                  if (!isPopular && item.contributions) {
                    for (const key of BLOCK_KEYS) {
                      const v = item.contributions[key];
                      if (v !== undefined && v > maxVal) {
                        maxVal = v;
                      }
                    }
                  }

                  return (
                    <TableRow key={item.id}>
                      {/* 0: # */}
                      <TableCell className="text-center font-mono text-xs">
                        {idx + 1}
                      </TableCell>

                      {/* 1: LUT */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.coverUrl ? (
                            <img
                              src={item.coverUrl}
                              alt={item.title}
                              className="w-16 aspect-video object-cover rounded border flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 aspect-video bg-muted rounded border flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`/luts/${item.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-sm hover:underline truncate"
                              >
                                {item.title}
                              </a>
                              {item.isPremium === 1 && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1">
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {categoryNames[item.style] ?? item.style}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2: Điểm */}
                      <TableCell className="text-right font-mono text-xs">
                        {isPopular || item.score === undefined
                          ? "—"
                          : formatVnDecimal(item.score, 4)}
                      </TableCell>

                      {/* 3..8: 6 cột đóng góp */}
                      {BLOCK_KEYS.map((key: BlockKey) => {
                        const val = item.contributions?.[key];
                        const isMax = !isPopular && val !== undefined && val === maxVal;
                        return (
                          <TableCell
                            key={key}
                            className={cn(
                              "text-right font-mono text-xs",
                              isMax && "font-bold"
                            )}
                          >
                            {isPopular || val === undefined
                              ? "—"
                              : formatVnDecimal(val, 4)}
                          </TableCell>
                        );
                      })}

                      {/* 9: Câu giải thích */}
                      <TableCell className="text-sm text-muted-foreground whitespace-normal">
                        {item.reason ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Tính trực tiếp từ dữ liệu hiện tại; không dùng cache hồ sơ và không ghi lượt hiển thị.
        </p>
      </CardContent>
    </Card>
  );
}
