import type { OrderListItemDTO } from "@/lib/types/account";
import type { PagedResult } from "@/lib/types/common";

export type UserStatus = "ACTIVE" | "LOCKED";

/** Một dòng tài khoản ở /admin/tai-khoan (plan §5.1). Cũng là `result` của lock / unlock / change-role. */
export interface UserAdminItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  roleId: number;
  roleName: string;
  /** 1 = chức vụ toàn quyền */
  isOperator: number;
  status: UserStatus;
  regisDate?: string;
  planCode: string;
  planName: string;
  /** Chỉ có với gói trả phí */
  planExpiresAt?: string;
}

/** `subscription` của chi tiết: gói Miễn phí chỉ có `planCode`, `planName`. */
export interface UserAdminSubscription {
  planCode: string;
  planName: string;
  cycle?: string;
  startDate?: string;
  endDate?: string;
  autoRenew?: number;
}

export interface UserAdminStats {
  paidOrders: number;
  totalPaid: number;
  downloads: number;
  collections: number;
}

export interface UserDownloadItem {
  lutId: number;
  lutSlug?: string;
  lutTitle?: string;
  coverUrl?: string;
  /** Gói của khách lúc tải */
  planCode?: string;
  createdTime: string;
}

/** `GET /user/get` (plan §5.2). */
export interface UserAdminDetail extends UserAdminItem {
  subscription: UserAdminSubscription;
  stats: UserAdminStats;
  preferences: string[];
  recentOrders: OrderListItemDTO[];
  recentDownloads: UserDownloadItem[];
}

/** `GET /user/role-options` (plan §5.6). */
export interface RoleOption {
  id: number;
  name: string;
  isOperator: number;
  isDefault: number;
}

/** `GET /user/list`: bộ lọc không có giá trị thì không gửi. */
export interface UserAdminListParams {
  keyword?: string;
  roleId?: number;
  planCode?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export type UserAdminListResponse = PagedResult<UserAdminItem>;
