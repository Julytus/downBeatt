import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Lock,
  XCircle
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import {
  cancelOrderMutationOptions,
  cancelOrderSilentMutationOptions,
  orderQueryOptions
} from "@/lib/tanstack/options/billing";
import { formatVnd } from "@/lib/utils/money";
import { formatPlanDate } from "@/lib/utils/plan";

interface PaymentResultPageProps {
  code: string;
}

export function PaymentResultPage({ code }: PaymentResultPageProps) {
  const token = useAuthStore((s) => s.accessToken);
  const openDialog = useShopDialog((s) => s.open);
  const queryClient = useQueryClient();

  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [isOver60s, setIsOver60s] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const hasInvalidatedAccountRef = useRef(false);
  const hasAutoCancelledRef = useRef(false);

  const {
    data: order,
    isPending,
    isError,
    error,
    refetch
  } = useQuery(orderQueryOptions(code, !isOver60s, token));

  const { mutate: cancelOrderMutate } = useMutation({
    ...cancelOrderMutationOptions,
    onSuccess: (updated) => {
      queryClient.setQueriesData({ queryKey: ["order", code] }, updated);
      setShowCancelDialog(false);
    }
  });

  const { mutate: autoCancelOrderMutate } = useMutation({
    ...cancelOrderSilentMutationOptions,
    onSuccess: (updated) => {
      queryClient.setQueriesData({ queryKey: ["order", code] }, updated);
    }
  });

  // Đổi title trang theo plan §6.4
  useEffect(() => {
    document.title = "Kết quả thanh toán | DownBeat";
  }, []);

  // Đơn PENDING: đếm 60s
  useEffect(() => {
    if (order?.status !== "PENDING") {
      setIsOver60s(false);
      return;
    }
    const check = () => {
      if (Date.now() - startedAt >= 60_000) {
        setIsOver60s(true);
      }
    };
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [order?.status, startedAt]);

  // cancel=true trên URL và lần đầu thấy PENDING → gọi order/cancel 1 lần
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isCancel = params.get("cancel") === "true";
    if (isCancel && order?.status === "PENDING" && !hasAutoCancelledRef.current) {
      hasAutoCancelledRef.current = true;
      autoCancelOrderMutate(code, {
        onError: () => {
          // lỗi ORDER_INVALID_STATUS bỏ qua, đọc lại đơn
          void refetch();
        }
      });
    }
  }, [order?.status, code, refetch, autoCancelOrderMutate]);

  // Lần đầu thấy PAID: invalidate query account-me để header đổi gói
  useEffect(() => {
    if (order?.status === "PAID" && !hasInvalidatedAccountRef.current) {
      hasInvalidatedAccountRef.current = true;
      void queryClient.invalidateQueries({ queryKey: ["account-me"] });
    }
  }, [order?.status, queryClient]);

  const handleRetryCheck = () => {
    setStartedAt(Date.now());
    setIsOver60s(false);
    void refetch();
  };

  // 1. Chưa đăng nhập
  if (!token) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center p-6 text-center">
        <Lock className="size-16 text-(--sh-pink)" aria-hidden />
        <h1 className="font-display mt-4 text-2xl font-bold">Đăng nhập để xem đơn hàng</h1>
        <p className="mt-2 text-sm text-(--sh-muted)">Đơn hàng gắn với tài khoản đã mua.</p>
        <ShopButton
          variant="primary"
          className="mt-6 w-full"
          onClick={() => openDialog({ type: "login" })}
        >
          Đăng nhập
        </ShopButton>
      </div>
    );
  }

  // 2. Đang tải lần đầu
  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center p-6 text-center">
        <Skeleton className="size-16 rounded-full bg-(--sh-surface)" />
        <Skeleton className="mt-4 h-8 w-64 bg-(--sh-surface)" />
        <Skeleton className="mt-2 h-5 w-80 bg-(--sh-surface)" />
        <Skeleton className="mt-6 h-48 w-full rounded-[8px] bg-(--sh-surface)" />
      </div>
    );
  }

  // 3. Lỗi 404 hoặc lỗi khác
  if (isError) {
    const is404 = (error as AxiosError)?.response?.status === 404;
    if (is404) {
      return (
        <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center p-6 text-center">
          <HelpCircle className="size-16 text-(--sh-muted)" aria-hidden />
          <h1 className="font-display mt-4 text-2xl font-bold">Không tìm thấy đơn hàng</h1>
          <p className="mt-2 text-sm text-(--sh-muted)">Mã đơn không đúng hoặc thuộc tài khoản khác.</p>
          <ShopButton asChild variant="primary" className="mt-6 w-full">
            <Link to="/pricing">Xem bảng giá</Link>
          </ShopButton>
        </div>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="size-16 text-destructive" aria-hidden />
        <h1 className="font-display mt-4 text-2xl font-bold">Không tải được đơn hàng</h1>
        <ShopButton variant="primary" className="mt-6 w-full" onClick={() => void refetch()}>
          Thử lại
        </ShopButton>
      </div>
    );
  }

  if (!order) return null;

  // Bảng tóm tắt đơn hàng
  const summaryBlock = (
    <dl className="mt-6 flex w-full flex-col gap-2 rounded-[8px] bg-(--sh-surface) p-4 text-left text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-(--sh-muted)">Mã đơn</dt>
        <dd className="font-mono font-semibold">{order.code}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-(--sh-muted)">Gói</dt>
        <dd className="font-semibold">{order.planName}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-(--sh-muted)">Chu kỳ</dt>
        <dd>{order.cycle === "YEAR" ? "Theo năm" : "Theo tháng"}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-(--sh-muted)">Số tiền</dt>
        <dd className="font-bold">{formatVnd(order.amount)}</dd>
      </div>
    </dl>
  );

  // 4. PENDING <= 60s
  if (order.status === "PENDING" && !isOver60s) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center p-6 text-center">
        <Loader2 className="size-16 animate-spin text-(--sh-pink)" aria-hidden />
        <h1 className="font-display mt-4 text-2xl font-bold">Đang chờ xác nhận thanh toán</h1>
        <p className="mt-2 text-sm text-(--sh-muted)">
          payOS đang báo kết quả về DownBeat. Trang tự cập nhật, bạn không cần tải lại.
        </p>
        {summaryBlock}
      </div>
    );
  }

  // 5. PENDING > 60s
  if (order.status === "PENDING" && isOver60s) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center p-6 text-center">
        <Clock className="size-16 text-amber-500" aria-hidden />
        <h1 className="font-display mt-4 text-2xl font-bold">Chưa nhận được thanh toán</h1>
        <p className="mt-2 text-sm text-(--sh-muted)">
          Nếu bạn đã chuyển khoản, gói sẽ được kích hoạt ngay khi payOS xác nhận.
        </p>
        {summaryBlock}

        <div className="mt-6 flex w-full flex-col gap-2.5">
          <ShopButton variant="primary" className="w-full" onClick={handleRetryCheck}>
            Kiểm tra lại
          </ShopButton>
          {order.checkoutUrl && (
            <ShopButton asChild variant="secondary" className="w-full">
              <a href={order.checkoutUrl}>Tiếp tục thanh toán</a>
            </ShopButton>
          )}
          <ShopButton
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setShowCancelDialog(true)}
          >
            Huỷ đơn
          </ShopButton>
        </div>

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent className="shop border-(--sh-border) bg-(--sh-elevated) text-(--sh-fg)">
            <AlertDialogHeader>
              <AlertDialogTitle>Huỷ đơn {order.code}?</AlertDialogTitle>
              <AlertDialogDescription className="text-(--sh-muted)">
                Link thanh toán sẽ không dùng được nữa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Không</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => cancelOrderMutate(order.code)}
              >
                Huỷ đơn
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // 6. PAID
  if (order.status === "PAID") {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="size-16 text-(--sh-success)" aria-hidden />
        <h1 className="font-display mt-4 text-2xl font-bold">Thanh toán thành công</h1>
        <p className="mt-2 text-sm text-(--sh-muted)">
          Gói {order.planName} đã được kích hoạt, dùng đến {formatPlanDate(order.planExpiresAt)}.
        </p>
        {summaryBlock}

        <div className="mt-6 flex w-full flex-col gap-2.5">
          {order.sourceLutSlug ? (
            <>
              <ShopButton asChild variant="primary" className="w-full">
                <Link to="/luts/$slug" params={{ slug: order.sourceLutSlug }}>
                  Quay lại LUT {order.sourceLutTitle ?? "này"}
                </Link>
              </ShopButton>
              <ShopButton asChild variant="secondary" className="w-full">
                <Link to="/luts">Vào kho LUT</Link>
              </ShopButton>
            </>
          ) : (
            <ShopButton asChild variant="primary" className="w-full">
              <Link to="/luts">Vào kho LUT</Link>
            </ShopButton>
          )}
        </div>
      </div>
    );
  }

  // 7. CANCELLED
  if (order.status === "CANCELLED") {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center p-6 text-center">
        <XCircle className="size-16 text-(--sh-muted)" aria-hidden />
        <h1 className="font-display mt-4 text-2xl font-bold">Đơn đã huỷ</h1>
        <p className="mt-2 text-sm text-(--sh-muted)">
          Bạn chưa bị trừ tiền. Có thể chọn lại gói bất cứ lúc nào.
        </p>
        {summaryBlock}
        <ShopButton asChild variant="primary" className="mt-6 w-full">
          <Link to="/pricing">Xem bảng giá</Link>
        </ShopButton>
      </div>
    );
  }

  // 8. EXPIRED
  if (order.status === "EXPIRED") {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="size-16 text-amber-500" aria-hidden />
        <h1 className="font-display mt-4 text-2xl font-bold">Đơn đã hết hạn</h1>
        <p className="mt-2 text-sm text-(--sh-muted)">
          Link thanh toán đã quá 24 giờ. Hãy tạo đơn mới.
        </p>
        {summaryBlock}
        <ShopButton asChild variant="primary" className="mt-6 w-full">
          <Link to="/pricing">Xem bảng giá</Link>
        </ShopButton>
      </div>
    );
  }

  return null;
}
