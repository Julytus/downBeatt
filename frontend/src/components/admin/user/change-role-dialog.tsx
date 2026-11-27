import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RoleOption, UserAdminItem } from "@/lib/types/user-admin";

/** Hộp thoại "Đổi chức vụ" (plan §6.5). Người không toàn quyền không thấy chức vụ toàn quyền. */
export function ChangeRoleDialog({
  user,
  roles,
  meIsOperator,
  isLoading,
  onOpenChange,
  onSubmit
}: {
  user: UserAdminItem | null;
  roles: RoleOption[];
  meIsOperator: boolean;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (user: UserAdminItem, roleId: number) => void;
}) {
  const [roleId, setRoleId] = React.useState("");

  React.useEffect(() => {
    setRoleId(user ? String(user.roleId) : "");
  }, [user]);

  const options = roles.filter((r) => meIsOperator || r.isOperator !== 1);
  const selected = roles.find((r) => String(r.id) === roleId);
  const unchanged = !user || roleId === String(user.roleId) || !roleId;

  return (
    <Dialog open={user !== null} onOpenChange={(open) => {
        if (!isLoading) onOpenChange(open);
      }}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (user && !unchanged) onSubmit(user, Number(roleId));
          }}
        >
          <DialogHeader>
            <DialogTitle>Đổi chức vụ</DialogTitle>
            <DialogDescription>
              Tài khoản: {user?.name} ({user?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="change-role-select">Chức vụ</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger id="change-role-select" className="w-full">
                <SelectValue placeholder="Chọn chức vụ" />
              </SelectTrigger>
              <SelectContent>
                {options.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.isOperator === 1 ? `${r.name} (toàn quyền)` : r.name}
                  </SelectItem>
                ))}
                {/* Chức vụ hiện tại vẫn hiện tên dù bị lọc (người không toàn quyền không mở được dialog cho tài khoản toàn quyền) */}
                {user && !options.some((r) => r.id === user.roleId) && (
                  <SelectItem value={String(user.roleId)} disabled>
                    {user.roleName}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {selected?.isOperator === 1 && roleId !== String(user?.roleId) && (
              <p className="text-destructive text-sm">
                Chức vụ toàn quyền có mọi quyền quản trị, kể cả khoá tài khoản khác.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={unchanged || isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
