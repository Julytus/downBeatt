import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { UserAdminItem } from "@/lib/types/user-admin";

export interface UserActionHandlers {
  onView: (user: UserAdminItem) => void;
  onChangeRole: (user: UserAdminItem) => void;
  onLock: (user: UserAdminItem) => void;
  onUnlock: (user: UserAdminItem) => void;
}

/** Menu ⋮ của một dòng. `canManage` = có UPDATE và được phép theo luật §5.7. */
export function UserActionsMenu({
  user,
  canManage,
  onView,
  onChangeRole,
  onLock,
  onUnlock
}: { user: UserAdminItem; canManage: boolean } & UserActionHandlers) {
  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
            aria-label={`Thao tác với ${user.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => onView(user)}>Xem chi tiết</DropdownMenuItem>
          {canManage && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onChangeRole(user)}>Đổi chức vụ</DropdownMenuItem>
              {user.status === "ACTIVE" ? (
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onLock(user)}>
                  Khoá tài khoản
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => onUnlock(user)}>Mở khoá</DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
