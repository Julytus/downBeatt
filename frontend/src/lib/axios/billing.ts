import axiosInstance from "@/lib/axios/instance";
import type {
  CreateOrderRequest,
  CreateOrderResult,
  OrderDTO,
  OrderListItemDTO,
  PlanDTO,
  SubscriptionDTO
} from "@/lib/types/account";
import type { ApiResponse, PagedResult } from "@/lib/types/common";

/** GET /plan/public/list (plan §5.1) — danh sách gói công khai. */
export async function getPlans(): Promise<PlanDTO[]> {
  const res = await axiosInstance.get<ApiResponse<PlanDTO[]>>("/plan/public/list");
  return res.data.result;
}

/** POST /order/create (plan §5.2) — tạo đơn thanh toán payOS. */
export async function createOrder(req: CreateOrderRequest): Promise<CreateOrderResult> {
  const res = await axiosInstance.post<ApiResponse<CreateOrderResult>>("/order/create", req);
  return res.data.result;
}

/** GET /order/get?code= (plan §5.3) — lấy thông tin đơn hàng. */
export async function getOrder(code: string): Promise<OrderDTO> {
  const res = await axiosInstance.get<ApiResponse<OrderDTO>>("/order/get", {
    params: { code }
  });
  return res.data.result;
}

/** POST /order/cancel/{code} (plan §5.4) — huỷ đơn hàng PENDING. */
export async function cancelOrder(code: string): Promise<OrderDTO> {
  const res = await axiosInstance.post<ApiResponse<OrderDTO>>(`/order/cancel/${code}`);
  return res.data.result;
}

/** GET /order/my-list (plan §5.1) — lấy danh sách đơn hàng của chính mình. */
export async function getMyOrders(page = 1, limit = 10): Promise<PagedResult<OrderListItemDTO>> {
  const res = await axiosInstance.get<ApiResponse<PagedResult<OrderListItemDTO>>>("/order/my-list", {
    params: { page, limit }
  });
  return res.data.result;
}

/** GET /subscription/my (plan §5.2) — lấy gói đang dùng của tài khoản. */
export async function getMySubscription(): Promise<SubscriptionDTO> {
  const res = await axiosInstance.get<ApiResponse<SubscriptionDTO>>("/subscription/my");
  return res.data.result;
}

/** POST /subscription/cancel (plan §5.3) — huỷ tự gia hạn gói đang dùng. */
export async function cancelSubscription(): Promise<SubscriptionDTO> {
  const res = await axiosInstance.post<ApiResponse<SubscriptionDTO>>("/subscription/cancel", {});
  return res.data.result;
}
