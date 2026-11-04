import { MOCK_PLANS } from "@/lib/mock/data/plans";
import { delay } from "@/lib/mock/luts";
import type {
  CheckoutRequest,
  LutDownloadDTO,
  PlanDTO,
  ShopLoginRequest,
  ShopRegisterRequest,
  ShopUserDTO
} from "@/lib/types/account";
import type { LutDTO } from "@/lib/types/lut";

/**
 * API giả cho tài khoản khách hàng (đăng ký, đăng nhập, nâng cấp gói, tải LUT).
 * "Database" là localStorage của trình duyệt. Khi backend sẵn sàng, thay bằng `lib/axios/account.ts`.
 *
 * Tài khoản mẫu (mật khẩu Admin@123): free@downbeat.local (gói Miễn phí), pro@downbeat.local (gói Pro).
 */
const DB_KEY = "downbeat-mock-users";

type StoredUser = ShopUserDTO & { password: string };

const SEED_USERS: StoredUser[] = [
  { id: "u-free", name: "Khách Miễn Phí", email: "free@downbeat.local", password: "Admin@123", plan: "free", planExpiresAt: null },
  { id: "u-pro", name: "Khách Pro", email: "pro@downbeat.local", password: "Admin@123", plan: "pro", planExpiresAt: "2027-11-05" }
];

/** Lỗi nghiệp vụ giả, message giống backend trả về */
export class ApiError extends Error {
  readonly errorCode: string;
  constructor(message: string, errorCode: string) {
    super(message);
    this.errorCode = errorCode;
  }
}

function readDb(): StoredUser[] {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as StoredUser[];
  } catch {
    // storage bị chặn: dùng dữ liệu mẫu
  }
  return [...SEED_USERS];
}

function writeDb(users: StoredUser[]) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
  } catch {
    // bỏ qua
  }
}

const toDto = (u: StoredUser): ShopUserDTO => ({
  id: u.id,
  name: u.name,
  email: u.email,
  plan: u.plan,
  planExpiresAt: u.planExpiresAt
});

export async function login({ email, password }: ShopLoginRequest): Promise<ShopUserDTO> {
  await delay(500);
  const user = readDb().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    throw new ApiError("Email hoặc mật khẩu không đúng", "INVALID_CREDENTIALS");
  }
  return toDto(user);
}

export async function register({ name, email, password }: ShopRegisterRequest): Promise<ShopUserDTO> {
  await delay(600);
  const users = readDb();
  if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    throw new ApiError("Email đã được đăng ký", "EMAIL_EXISTS");
  }
  const user: StoredUser = {
    id: `u-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    plan: "free",
    planExpiresAt: null
  };
  writeDb([...users, user]);
  return toDto(user);
}

/** Bản thật: POST /auth/logout (thu hồi refresh token) */
export async function logout(): Promise<void> {
  await delay(150);
}

export async function getPlans(): Promise<PlanDTO[]> {
  await delay(150);
  return MOCK_PLANS;
}

/** Thanh toán giả: đổi gói ngay. Bản thật sẽ tạo đơn + chuyển sang cổng thanh toán (VNPay/MoMo). */
export async function checkout(userId: string, { plan, cycle }: CheckoutRequest): Promise<ShopUserDTO> {
  await delay(900);
  const users = readDb();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new ApiError("Phiên đăng nhập đã hết, vui lòng đăng nhập lại", "UNAUTHORIZED");
  const expires = new Date();
  expires.setMonth(expires.getMonth() + (cycle === "year" ? 12 : 1));
  user.plan = plan;
  user.planExpiresAt = expires.toISOString().slice(0, 10);
  writeDb(users);
  return toDto(user);
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
