import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

/** Chữ cái đầu của 2 từ cuối trong tên (tên tiếng Việt: "Nguyễn Văn An" → "VA"). */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(-2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function AdminUser({
  user
}: {
  user: {
    name: string;
    email: string;
    /** Không có ảnh thì hiện chữ cái đầu (không gọi dịch vụ avatar bên ngoài => không lộ tên người dùng). */
    avatar?: string | null;
    roleName: string;
  };
}) {
  const navigate = useNavigate();
  const avatar = (
    <Avatar className="h-8 w-8 rounded-lg">
      {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
      <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          {avatar}
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold">{user.name}</span>
            <span className="truncate text-xs">Chức vụ: {user.roleName}</span>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            {avatar}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/logout" })}>
          <LogOut />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
