import { refreshAccessToken } from "@/lib/axios/auth";
import env from "@/lib/env";
import { useAuthStore } from "@/lib/stores/auth";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const axiosInstance = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Mọi request 401 trong lúc đang refresh dùng chung 1 lần gọi /auth/refresh
let refreshPromise: Promise<string> | null = null;

/** Hết phiên: xoá token và về trang đăng nhập (layout /admin cũng tự chuyển khi store trống). */
function endSession() {
  useAuthStore.getState().clear();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    // Chỉ thử refresh với 401 của request đã đăng nhập (có refresh token), mỗi request tối đa 1 lần
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !useAuthStore.getState().refreshToken
    ) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Mọi request đang chờ cùng nhận lỗi (trước đây bị treo vĩnh viễn)
      endSession();
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
