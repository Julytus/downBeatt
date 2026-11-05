import type { ApiResponse } from "@/lib/types/common";
import type {
  LoginApiRequest,
  LoginApiResponse,
  MeApiResponse,
  PermissionResourceDTO
} from "@/lib/types/auth";
import axiosInstance from "@/lib/axios/instance";
import axios from "axios";
import env from "@/lib/env";
import { useAuthStore } from "@/lib/stores/auth";

export const login = async (data: LoginApiRequest) => {
  const response = await axiosInstance.post<LoginApiResponse>("/user/authenticate", data);
  return response.data.result;
};

export const getMe = async () => {
  const response = await axiosInstance.get<MeApiResponse>("/user/info");
  return response.data.result;
};

export const getPermissionResources = async () => {
  const response = await axiosInstance.get<ApiResponse<PermissionResourceDTO[]>>("/permission/resource");
  return response.data.result;
};

// Refresh/logout đi bằng axios riêng (không qua interceptor của axiosInstance) để 401 của chính
// /auth/refresh không kích hoạt vòng refresh lồng nhau.
const authClient = axios.create({ baseURL: env.VITE_API_URL, withCredentials: true });

export const refreshAccessToken = async () => {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) throw new Error("No refresh token");

  const response = await authClient.post<LoginApiResponse>("/auth/refresh", { refreshToken });
  const { token, refreshToken: newRefreshToken, userId } = response.data.result;

  useAuthStore.getState().set({
    accessToken: token,
    refreshToken: newRefreshToken,
    userId
  });

  return token;
};

/** Thu hồi refresh token trên server; lỗi mạng cũng bỏ qua (client vẫn xoá token cục bộ). */
export const logoutRemote = async (refreshToken: string | null) => {
  if (!refreshToken) return;
  try {
    await authClient.post("/auth/logout", { refreshToken });
  } catch {
    // bỏ qua
  }
};
