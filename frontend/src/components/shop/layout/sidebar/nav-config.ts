import type { LinkProps } from "@tanstack/react-router";
import {
  AudioWaveform,
  Diamond,
  HandCoins,
  LifeBuoy,
  MessageSquare,
  Music,
  Pipette,
  Play,
  Spline,
  Star,
  TrendingUp,
  type LucideIcon
} from "lucide-react";

export interface ShopNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Route đã có. Bỏ trống = trang chưa làm (hiện nhãn "Sắp ra mắt"). */
  to?: LinkProps["to"];
}

/** Menu trái, mỗi mảng con là một nhóm (ngăn bằng đường kẻ). Thêm trang mới: thêm `to` ở đây. */
export const SHOP_NAV_GROUPS: ShopNavItem[][] = [
  [
    { id: "music", label: "Âm nhạc", icon: Music },
    { id: "sfx", label: "Hiệu ứng âm thanh", icon: AudioWaveform },
    { id: "video", label: "Video stock", icon: Play },
    { id: "motion", label: "Đồ hoạ chuyển động", icon: Spline },
    { id: "luts", label: "LUTs", icon: Pipette, to: "/luts" },
    { id: "trending", label: "Thịnh hành", icon: TrendingUp },
    { id: "playlist", label: "Tạo playlist", icon: Diamond }
  ],
  [{ id: "pricing", label: "Bảng giá", icon: Star, to: "/pricing" }],
  [
    { id: "refer", label: "Giới thiệu bạn bè", icon: HandCoins },
    { id: "help", label: "Trung tâm trợ giúp", icon: LifeBuoy },
    { id: "blog", label: "Blog", icon: MessageSquare }
  ]
];
