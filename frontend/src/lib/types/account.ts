/** Gói tài khoản khách hàng. `free` chỉ tải được LUT miễn phí; gói trả phí tải được cả LUT Premium. */
export const PLAN_CODES = ["free", "pro", "studio"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export type BillingCycle = "month" | "year";
export type ApiBillingCycle = "MONTH" | "YEAR";

export interface PlanDTO {
  code: PlanCode;
  name: string;
  audience: string;
  /** Giá theo tháng (VND) khi trả từng tháng / khi trả theo năm */
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  canDownloadPremium: 0 | 1;
  maxMembers: number;
  isHighlight: 0 | 1;
  /** Các dòng "Giấy phép cho", "Quyền lợi" trên thẻ gói */
  license: string[];
  features: string[];
}

export interface ShopUserDTO {
  id: number;
  name: string;
  email: string;
  plan: PlanCode;
  /** Ngày gói trả phí hết hạn (ISO "YYYY-MM-DD"), không có với gói miễn phí */
  planExpiresAt?: string;
}

/** Response từ GET /api/account/me (plan §5.8). */
export interface AccountMeApiDTO {
  id: number;
  name: string;
  email: string;
  plan: PlanCode;
  planExpiresAt?: string;
}

export interface ShopLoginRequest {
  email: string;
  password: string;
}

export interface ShopRegisterRequest {
  name: string;
  email: string;
  password: string;
}

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";

export interface OrderDTO {
  code: string;
  planCode: string;
  planName: string;
  cycle: ApiBillingCycle;
  amount: number;
  status: OrderStatus;
  checkoutUrl?: string;
  sourceLutId?: number;
  sourceLutSlug?: string;
  sourceLutTitle?: string;
  createdTime: string;
  paidTime?: string;
  planExpiresAt?: string;
}

export interface CreateOrderRequest {
  planCode: string;
  cycle: ApiBillingCycle;
  sourceLutId?: number;
}

export interface CreateOrderResult {
  code: string;
  amount: number;
  checkoutUrl: string;
}

export interface LutDownloadRequest {
  lutId: number;
}

/** Kết quả xin tải: URL ký sẵn từ MinIO kèm tên file (plan §5.1) */
export interface LutDownloadDTO {
  fileName: string;
  url: string;
}
