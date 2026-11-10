/** Gói tài khoản khách hàng. `free` chỉ tải được LUT miễn phí; gói trả phí tải được cả LUT Premium. */
export const PLAN_CODES = ["free", "pro", "studio"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export type BillingCycle = "month" | "year";

export interface PlanDTO {
  code: PlanCode;
  name: string;
  audience: string;
  /** Giá theo tháng (VND) khi trả từng tháng / khi trả theo năm */
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  highlight?: boolean;
  /** Các dòng "Giấy phép cho", "Quyền lợi" trên thẻ gói */
  license: string[];
  features: string[];
}

export interface ShopUserDTO {
  id: number;
  name: string;
  email: string;
  plan: PlanCode;
  /** Ngày gói trả phí hết hạn (ISO), null với gói miễn phí */
  planExpiresAt: string | null;
}

/** Response từ GET /api/account/me (plan §5.2). */
export interface AccountMeApiDTO {
  id: number;
  name: string;
  email: string;
  plan: PlanCode;
  planExpiresAt?: string | null;
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

export interface CheckoutRequest {
  plan: Exclude<PlanCode, "free">;
  cycle: BillingCycle;
}

/** Kết quả xin tải: file .cube (bản giả tạo ngay ở client; bản thật là URL ký sẵn từ MinIO) */
export interface LutDownloadDTO {
  fileName: string;
  url: string;
}
