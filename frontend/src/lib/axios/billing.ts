import axiosInstance from "@/lib/axios/instance";
import type {
  CreateOrderRequest,
  CreateOrderResult,
  OrderDTO,
  PlanDTO
} from "@/lib/types/account";
import type { ApiResponse } from "@/lib/types/common";

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
