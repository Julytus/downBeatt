import axiosInstance from "@/lib/axios/instance";
import type { AccountMeApiDTO, ShopLoginRequest, ShopRegisterRequest, ShopUserDTO } from "@/lib/types/account";
import type { LoginResponseDTO } from "@/lib/types/auth";
import type { ApiResponse } from "@/lib/types/common";
import type { PreferenceDTO } from "@/lib/types/recommend";

/** POST /account/register (plan §5.1) — đăng ký tài khoản khách hàng mới. */
export async function register(req: ShopRegisterRequest): Promise<LoginResponseDTO> {
  const payload = {
    name: req.name,
    email: req.email,
    plainPassword: req.password
  };
  const res = await axiosInstance.post<ApiResponse<LoginResponseDTO>>("/account/register", payload);
  return res.data.result;
}

/** POST /user/authenticate (plan §5.3) — đăng nhập tài khoản. */
export async function loginShop(req: ShopLoginRequest): Promise<LoginResponseDTO> {
  const payload = {
    email: req.email,
    plainPassword: req.password
  };
  const res = await axiosInstance.post<ApiResponse<LoginResponseDTO>>("/user/authenticate", payload);
  return res.data.result;
}

/** GET /account/me (plan §5.2) — lấy thông tin tài khoản đang đăng nhập ở cửa hàng. */
export async function getAccountMe(): Promise<ShopUserDTO> {
  const res = await axiosInstance.get<ApiResponse<AccountMeApiDTO>>("/account/me");
  const dto = res.data.result;
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    plan: dto.plan,
    planExpiresAt: dto.planExpiresAt ?? undefined,
    planAutoRenew: dto.planAutoRenew
  };
}

/** GET /account/preference (plan §5.1) — lấy danh sách sở thích màu đã lưu. */
export async function getPreference(): Promise<PreferenceDTO> {
  const res = await axiosInstance.get<ApiResponse<PreferenceDTO>>("/account/preference");
  return res.data.result;
}

/** POST /account/preference (plan §5.2) — lưu sở thích màu, thay toàn bộ danh sách cũ. */
export async function savePreference(categorySlugs: string[]): Promise<PreferenceDTO> {
  const res = await axiosInstance.post<ApiResponse<PreferenceDTO>>("/account/preference", {
    categorySlugs
  });
  return res.data.result;
}
