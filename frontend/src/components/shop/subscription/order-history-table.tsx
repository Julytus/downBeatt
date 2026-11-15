import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { myOrdersQueryOptions } from "@/lib/tanstack/options/billing";
import { formatVnd } from "@/lib/utils/money";
import {
  cycleLabel,
  formatOrderDateTime,
  orderStatusLabel
} from "@/lib/utils/plan";

const PAGE_SIZE = 10;

export function OrderHistoryTable() {
  const search = useSearch({ strict: false }) as { trang?: number };
  const navigate = useNavigate();

  const page = search.trang && search.trang >= 1 ? search.trang : 1;

  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery(myOrdersQueryOptions(page));

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handlePageChange = (newPage: number) => {
    void navigate({
      to: "/goi-cua-toi",
      search: {
        trang: newPage === 1 ? undefined : newPage
      }
    });
  };

  return (
    <section
      aria-labelledby="order-history-heading"
      className="rounded-[12px] border border-(--sh-border) bg-(--sh-elevated) p-6"
    >
      <div className="flex items-center justify-between border-b border-(--sh-border) pb-4">
        <h2 id="order-history-heading" className="text-sm font-semibold tracking-wide text-(--sh-muted) uppercase">
          Lịch sử đơn hàng
        </h2>
      </div>

      {isError ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-sm text-destructive">Không tải được lịch sử đơn hàng</p>
          <ShopButton variant="secondary" onClick={() => void refetch()}>
            Thử lại
          </ShopButton>
        </div>
      ) : isLoading ? (
        <div className="mt-4 overflow-x-auto rounded-[8px] border border-(--sh-border)">
          <Table className="w-full min-w-[680px]">
            <TableHeader>
              <TableRow className="border-(--sh-border) hover:bg-transparent">
                <TableHead className="text-(--sh-muted)">Mã đơn</TableHead>
                <TableHead className="text-(--sh-muted)">Gói</TableHead>
                <TableHead className="text-(--sh-muted)">Số tiền</TableHead>
                <TableHead className="text-(--sh-muted)">Trạng thái</TableHead>
                <TableHead className="text-(--sh-muted)">Ngày tạo</TableHead>
                <TableHead className="text-(--sh-muted)">Ngày thanh toán</TableHead>
                <TableHead className="w-[140px] text-right">
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-(--sh-border)">
                  <TableCell><Skeleton className="h-4 w-24 bg-(--sh-surface)" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 bg-(--sh-surface)" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-(--sh-surface)" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full bg-(--sh-surface)" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28 bg-(--sh-surface)" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28 bg-(--sh-surface)" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 bg-(--sh-surface)" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-3 py-10 text-center">
          <p className="text-sm text-(--sh-muted)">Bạn chưa có đơn hàng nào.</p>
          <ShopButton asChild variant="secondary">
            <Link to="/pricing">Xem bảng giá</Link>
          </ShopButton>
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-[8px] border border-(--sh-border)">
            <Table className="w-full min-w-[680px]">
              <TableHeader>
                <TableRow className="border-(--sh-border) hover:bg-transparent">
                  <TableHead className="text-(--sh-muted)">Mã đơn</TableHead>
                  <TableHead className="text-(--sh-muted)">Gói</TableHead>
                  <TableHead className="text-(--sh-muted)">Số tiền</TableHead>
                  <TableHead className="text-(--sh-muted)">Trạng thái</TableHead>
                  <TableHead className="text-(--sh-muted)">Ngày tạo</TableHead>
                  <TableHead className="text-(--sh-muted)">Ngày thanh toán</TableHead>
                  <TableHead className="w-[140px] text-right">
                    <span className="sr-only">Thao tác</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((order) => (
                  <TableRow key={order.code} className="border-(--sh-border) hover:bg-(--sh-surface)/50">
                    <TableCell className="font-medium">
                      <Link
                        to="/thanh-toan/ket-qua/$code"
                        params={{ code: order.code }}
                        className="font-semibold text-(--sh-accent) hover:underline"
                      >
                        {order.code}
                      </Link>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-(--sh-fg)">
                        {order.planName} · {cycleLabel(order.cycle)}
                      </div>
                      {order.sourceLutTitle && (
                        <div className="mt-0.5 text-xs text-(--sh-muted)">
                          Từ LUT{" "}
                          <Link
                            to="/luts/$slug"
                            params={{ slug: order.sourceLutSlug ?? "" }}
                            className="text-(--sh-fg) underline hover:text-(--sh-accent)"
                          >
                            {order.sourceLutTitle}
                          </Link>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="font-medium text-(--sh-fg)">
                      {formatVnd(order.amount)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          order.status === "PAID"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : order.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "border-(--sh-border) bg-(--sh-surface) text-(--sh-muted)"
                        }
                      >
                        {orderStatusLabel(order.status)}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm text-(--sh-muted)">
                      {formatOrderDateTime(order.createdTime)}
                    </TableCell>

                    <TableCell className="text-sm text-(--sh-muted)">
                      {order.paidTime ? formatOrderDateTime(order.paidTime) : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      {order.status === "PENDING" && order.checkoutUrl && (
                        <a
                          href={order.checkoutUrl}
                          className="text-xs font-semibold text-(--sh-accent) hover:underline"
                        >
                          Tiếp tục thanh toán
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {total > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between border-t border-(--sh-border) pt-4 text-sm">
              <span className="text-(--sh-muted)">
                Trang {page} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <ShopButton
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Trang trước
                </ShopButton>
                <ShopButton
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Trang sau
                </ShopButton>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
