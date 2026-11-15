import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useCanView } from "@/hooks/use-can-view";
import type { DashboardTopLutDTO } from "@/lib/types/dashboard";
import { formatCount } from "./format";

interface TopLutsCardProps {
  topLuts: DashboardTopLutDTO[];
}

export function TopLutsCard({ topLuts }: TopLutsCardProps) {
  const { canView } = useCanView();
  const canViewLut = canView("LUT");
  const isEmpty = topLuts.length === 0;

  return (
    <section aria-label="Top 10 LUT tải nhiều" className="lg:col-span-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top 10 LUT tải nhiều</CardTitle>
          <CardDescription>Xếp theo số lượt tải trong khoảng ngày.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              Chưa có lượt tải nào trong khoảng này.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table aria-label="Top LUT tải nhiều">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>LUT</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="text-right">Lượt tải</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLuts.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={item.coverUrl}
                            alt=""
                            className="aspect-video w-16 rounded object-cover"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            {canViewLut ? (
                              <Link
                                to="/admin/luts/$id"
                                params={{ id: String(item.id) }}
                                className="font-medium hover:underline"
                              >
                                {item.title}
                              </Link>
                            ) : (
                              <span className="font-medium">{item.title}</span>
                            )}
                            {item.status === "HIDDEN" && (
                              <Badge variant="outline" className="text-xs">
                                Đã ẩn
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.creatorName}</TableCell>
                      <TableCell>
                        {item.isPremium === 1 ? (
                          <Badge>Premium</Badge>
                        ) : (
                          "Thường"
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatCount(item.downloads)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
