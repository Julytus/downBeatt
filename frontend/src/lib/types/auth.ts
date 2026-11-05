import type { ApiResponse, Prettify } from "@/lib/types/common";

type LoginWithEmail = {
  email: string;
  phone?: never;
  plainPassword: string;
};

type LoginWithPhone = {
  phone: string;
  email?: never;
  plainPassword: string;
};

export type LoginApiRequest = LoginWithEmail | LoginWithPhone;

/** Dùng chung cho POST /user/authenticate và POST /auth/refresh. */
export interface LoginResponseDTO {
  /** Access token (JWT, ngắn hạn) gắn vào header Authorization. */
  token: string;
  /** Dùng 1 lần ở /auth/refresh để lấy cặp token mới. */
  refreshToken: string;
  userId: number;
}

export interface LoginApiResponse {
  code: number;
  message: string;
  result: LoginResponseDTO;
}

/** GET /user/info — người đang đăng nhập. */
export interface MeDTO {
  id: number;
  /** 1 = role toàn quyền (bỏ qua kiểm tra permission). */
  isOperator: number | null;
  roleId: number | null;
  roleName: string | null;
  name: string;
  alias: string | null;
  avatar: string | null;
  phone: string | null;
  phoneVerified: number | null;
  email: string | null;
  hasPassword: number | null;
  regisDate: string | null;
  active: number | null;
  firstTime: number | null;
  gender: number | null;
}

/** GET /permission/resource — resource (theo `code`) + actions mà role đăng nhập được dùng. */
export interface PermissionResourceDTO {
  code: string;
  /** Chuỗi JSON mảng action, vd '["VIEW","ADD"]' — kiểm tra bằng `actions.includes("VIEW")`. */
  actions: string;
}

export type MeApiResponse = Prettify<ApiResponse<MeDTO>>;
