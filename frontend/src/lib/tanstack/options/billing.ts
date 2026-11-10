import { mutationOptions, queryOptions, type MutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { cancelOrder, createOrder, getOrder, getPlans } from "@/lib/axios/billing";
import { useAuthStore } from "@/lib/stores/auth";
import type { CreateOrderRequest, CreateOrderResult, OrderDTO } from "@/lib/types/account";
import type { ErrorResponse } from "@/lib/types/common";

export const BILLING_QUERY_KEY = ["billing"] as const;

/** GET /plan/public/list — cache 5 phút (plan §5.1, §8). */
export const plansQueryOptions = queryOptions({
  queryKey: ["plans"],
  queryFn: getPlans,
  staleTime: 5 * 60 * 1000
});

/** GET /order/get?code= — hỏi trạng thái đơn hàng (plan §5.3, §6.4, §8). */
export const orderQueryOptions = (code: string, isPolling = true, token?: string | null) => {
  const currentToken = token !== undefined ? token : useAuthStore.getState().accessToken;
  return queryOptions({
    queryKey: ["order", code, currentToken ?? null],
    queryFn: () => getOrder(code),
    enabled: Boolean(code) && Boolean(currentToken),
    retry: (failureCount, error) => {
      const status = (error as AxiosError)?.response?.status;
      if (status && status >= 400 && status < 500) {
        return false;
      }
      return failureCount < 1;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "PENDING" && isPolling) {
        return 2000;
      }
      return false;
    }
  });
};

/** POST /order/create — tạo link payOS, tắt toast thành công (plan §5.2, §8). */
export const createOrderMutationOptions = mutationOptions<
  CreateOrderResult,
  AxiosError<ErrorResponse>,
  CreateOrderRequest
>({
  mutationFn: createOrder,
  meta: {
    errorMessage: "Không kết nối được cổng thanh toán, vui lòng thử lại"
  }
});

/** POST /order/cancel/{code} — huỷ đơn hàng qua AlertDialog (plan §5.4, §8). */
export const cancelOrderMutationOptions: MutationOptions<
  OrderDTO,
  AxiosError<ErrorResponse>,
  string
> = {
  mutationFn: cancelOrder,
  meta: {
    errorMessage: "Không huỷ được đơn hàng"
  }
};

/** POST /order/cancel/{code} — tự động huỷ đơn khi cancel=true trên URL, tắt toast lỗi (plan §6.4). */
export const cancelOrderSilentMutationOptions: MutationOptions<
  OrderDTO,
  AxiosError<ErrorResponse>,
  string
> = {
  mutationFn: cancelOrder,
  meta: {
    silentError: true
  }
};
