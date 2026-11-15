import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import {
  cancelSubscriptionMutationOptions,
  mySubscriptionQueryOptions
} from "@/lib/tanstack/options/billing";
import { cycleLabel, daysLeft, formatPlanDate } from "@/lib/utils/plan";
import { CancelPlanDialog } from "./cancel-plan-dialog";

export function CurrentPlanCard() {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const openDialog = useShopDialog((s) => s.open);

  const {
    data: sub,
    isLoading,
    isError,
    refetch
  } = useQuery(mySubscriptionQueryOptions);

  const cancelMutation = useMutation({
    ...cancelSubscriptionMutationOptions,
    onSuccess: () => {
      setCancelDialogOpen(false);
    }
  });

  const isFree = !sub || sub.planCode === "free";
  const isCancelled = sub?.autoRenew === 0;
  const days = sub?.endDate ? daysLeft(sub.endDate) : undefined;
  const isExpiringSoon = !isFree && !isCancelled && days !== undefined && days <= 3;

  return (
    <section
      aria-labelledby="current-plan-heading"
      className="rounded-[12px] border border-(--sh-border) bg-(--sh-elevated) p-6"
    >
      <div className="flex items-center justify-between border-b border-(--sh-border) pb-4">
        <h2 id="current-plan-heading" className="text-sm font-semibold tracking-wide text-(--sh-muted) uppercase">
          Gói hiện tại
        </h2>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-36 rounded-[6px] bg-(--sh-surface)" />
            <Skeleton className="h-6 w-20 rounded-full bg-(--sh-surface)" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-16 bg-(--sh-surface)" />
                <Skeleton className="h-5 w-24 bg-(--sh-surface)" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-9 w-32 rounded-full bg-(--sh-surface)" />
            <Skeleton className="h-9 w-36 rounded-full bg-(--sh-surface)" />
          </div>
        </div>
      ) : isError ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-sm text-destructive">Không tải được thông tin gói</p>
          <ShopButton variant="secondary" onClick={() => void refetch()}>
            Thử lại
          </ShopButton>
        </div>
      ) : isFree ? (
        <div className="mt-5 space-y-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-(--sh-fg)">
              Gói Miễn phí
            </h3>
            <p className="mt-1 text-sm text-(--sh-muted)">
              Bạn đang tải được mọi LUT miễn phí. Nâng cấp để tải toàn bộ LUT Premium.
            </p>
          </div>
          <div className="pt-2">
            <ShopButton asChild variant="primary">
              <Link to="/pricing">Xem bảng giá</Link>
            </ShopButton>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl font-bold text-(--sh-fg)">
              Gói {sub.planName}
            </h3>
            <Badge
              variant={isCancelled ? "secondary" : "default"}
              className={
                isCancelled
                  ? "border-(--sh-border) bg-(--sh-surface) text-(--sh-muted)"
                  : "bg-(--sh-primary) text-white"
              }
            >
              {isCancelled ? "Đã huỷ" : "Đang dùng"}
            </Badge>
          </div>

          {/* Khung nhắc sắp hết hạn khi chưa huỷ (role="status") */}
          {isExpiringSoon && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-[8px] border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-medium text-(--sh-fg)"
            >
              <AlertCircle className="size-4 shrink-0 text-amber-500" aria-hidden />
              <p>
                {days === 0
                  ? `Gói ${sub.planName} hết hạn hôm nay. Gia hạn để không gián đoạn việc tải LUT Premium.`
                  : `Gói ${sub.planName} hết hạn sau ${days} ngày. Gia hạn để không gián đoạn việc tải LUT Premium.`}
              </p>
            </div>
          )}

          {/* Dòng thông báo khi đã huỷ tự gia hạn */}
          {isCancelled && (
            <p className="text-sm text-(--sh-muted)">
              Gói {sub.planName} vẫn dùng được đến hết ngày {formatPlanDate(sub.endDate)}. Sau đó tài khoản trở về gói Miễn phí.
            </p>
          )}

          {/* Danh sách mô tả thông tin gói */}
          <dl className="grid grid-cols-2 gap-4 rounded-[8px] bg-(--sh-surface) p-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-(--sh-muted)">Chu kỳ</dt>
              <dd className="mt-0.5 text-sm font-medium text-(--sh-fg)">
                {cycleLabel(sub.cycle)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-(--sh-muted)">Bắt đầu</dt>
              <dd className="mt-0.5 text-sm font-medium text-(--sh-fg)">
                {formatPlanDate(sub.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-(--sh-muted)">Hết hạn</dt>
              <dd className="mt-0.5 text-sm font-medium text-(--sh-fg)">
                {formatPlanDate(sub.endDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-(--sh-muted)">Còn lại</dt>
              <dd className="mt-0.5 text-sm font-medium text-(--sh-fg)">
                {days === 0 ? "Hết hạn hôm nay" : `${days ?? 0} ngày`}
              </dd>
            </div>
          </dl>

          {/* Cụm nút thao tác */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ShopButton
              variant="primary"
              onClick={() =>
                openDialog({
                  type: "checkout",
                  plan: (sub.planCode === "studio" ? "studio" : "pro") as "pro" | "studio",
                  cycle: sub.cycle === "YEAR" ? "year" : "month"
                })
              }
            >
              Gia hạn gói {sub.planName}
            </ShopButton>

            {sub.planCode === "pro" && (
              <ShopButton
                variant="secondary"
                onClick={() =>
                  openDialog({
                    type: "checkout",
                    plan: "studio",
                    cycle: sub.cycle === "YEAR" ? "year" : "month"
                  })
                }
              >
                Nâng cấp lên Studio
              </ShopButton>
            )}

            {!isCancelled && (
              <ShopButton
                variant="ghost"
                onClick={() => setCancelDialogOpen(true)}
                className="text-(--sh-muted) hover:bg-destructive/10 hover:text-destructive"
              >
                Huỷ gói
              </ShopButton>
            )}
          </div>

          <CancelPlanDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            planName={sub.planName}
            endDate={sub.endDate}
            isLoading={cancelMutation.isPending}
            onConfirm={() => cancelMutation.mutate()}
          />
        </div>
      )}
    </section>
  );
}
