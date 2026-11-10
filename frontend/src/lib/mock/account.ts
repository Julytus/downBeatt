import { MOCK_PLANS } from "@/lib/mock/data/plans";
import type {
  CheckoutRequest,
  LutDownloadDTO,
  PlanDTO,
  ShopUserDTO
} from "@/lib/types/account";
import type { LutDTO } from "@/lib/types/lut";

/**
 * API giả cho các chức năng cửa hàng chưa nối backend (gói dịch vụ, thanh toán giả lập, tải LUT).
 * Đăng ký, đăng nhập và lấy thông tin tài khoản đã dùng API thật tại `lib/axios/account.ts`.
 */
const LATENCY_MS = 300;
export const delay = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

/** Lỗi nghiệp vụ giả, message giống backend trả về */
export class ApiError extends Error {
  readonly errorCode: string;
  constructor(message: string, errorCode: string) {
    super(message);
    this.errorCode = errorCode;
  }
}

export async function getPlans(): Promise<PlanDTO[]> {
  await delay(150);
  return MOCK_PLANS;
}

/** Thanh toán giả lập: đổi gói ngay trong phiên (plan §11 câu 1, TC-29). Gói chỉ giữ đến khi tải lại trang. */
export async function checkout(user: ShopUserDTO, { plan, cycle }: CheckoutRequest): Promise<ShopUserDTO> {
  await delay(900);
  const expires = new Date();
  expires.setMonth(expires.getMonth() + (cycle === "year" ? 12 : 1));
  return {
    ...user,
    plan,
    planExpiresAt: expires.toISOString().slice(0, 10)
  };
}

/** File .cube hợp lệ (LUT đồng nhất 2×2×2) để nút tải hoạt động thật với dữ liệu mẫu. */
function buildCube(lut: LutDTO) {
  const rows: string[] = [];
  for (let b = 0; b < 2; b++) for (let g = 0; g < 2; g++) for (let r = 0; r < 2; r++) rows.push(`${r} ${g} ${b}`);
  return [`TITLE "${lut.title}"`, `# DownBeat - ${lut.creator}`, "LUT_3D_SIZE 2", ...rows, ""].join("\n");
}

/** Xin tải LUT. LUT Premium cần gói trả phí còn hạn. */
export async function requestLutDownload(lut: LutDTO, user: ShopUserDTO | null): Promise<LutDownloadDTO> {
  await delay(400);
  if (!user) throw new ApiError("Vui lòng đăng nhập để tải LUT", "UNAUTHORIZED");
  if (lut.premium && user.plan === "free") {
    throw new ApiError("LUT Premium cần gói Pro hoặc Studio", "PLAN_REQUIRED");
  }
  const blob = new Blob([buildCube(lut)], { type: "text/plain" });
  return { fileName: `${lut.slug}.cube`, url: URL.createObjectURL(blob) };
}
