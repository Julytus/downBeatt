import * as React from "react";
import { z } from "zod";

import { FieldError } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { RoleDTO, RoleUpsertApiRequest } from "@/lib/types/role";
import { toFieldErrors } from "@/lib/utils/form-errors";

// `role.name` varchar(50) NOT NULL, UNIQUE (trùng tên do backend báo).
const roleSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên chức vụ").max(50, "Tên chức vụ tối đa 50 ký tự")
});

export function RoleFormDialog({
  open,
  role,
  isLoading,
  onOpenChange,
  onSubmit
}: {
  open: boolean;
  role: RoleDTO | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RoleUpsertApiRequest) => void;
}) {
  const [name, setName] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(false);
  const [isOperator, setIsOperator] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setName(role?.name ?? "");
    setIsDefault(role?.isDefault === 1);
    setIsOperator(role?.isOperator === 1);
    setErrors({});
  }, [role, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = roleSchema.safeParse({ name });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onSubmit({
      id: role?.id,
      name: parsed.data.name,
      isDefault: isDefault ? 1 : 0,
      isOperator: isOperator ? 1 : 0
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={role ? "Chỉnh sửa chức vụ" : "Tạo mới chức vụ"}
      featured={
        role ? "Cập nhật thông tin chức vụ" : "Tạo chức vụ mới để gán phân quyền cho người dùng"
      }
      onSubmit={handleSubmit}
      submitLabel={role ? "Cập nhật" : "Tạo mới"}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="role-name">Tên chức vụ</Label>
        <Input
          id="role-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
        />
        <FieldError>{errors.name}</FieldError>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="role-is-default">Chức vụ mặc định</Label>
          <p className="text-muted-foreground text-xs">
            Gán tự động cho tài khoản mới đăng ký (chỉ một chức vụ được đặt mặc định)
          </p>
        </div>
        <Switch id="role-is-default" checked={isDefault} onCheckedChange={setIsDefault} />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="role-is-operator">Toàn quyền (Operator)</Label>
          <p className="text-muted-foreground text-xs">
            Bỏ qua kiểm tra phân quyền theo tài nguyên — chỉ bật cho chức vụ quản trị cấp cao nhất
          </p>
        </div>
        <Switch id="role-is-operator" checked={isOperator} onCheckedChange={setIsOperator} />
      </div>
    </FormDialog>
  );
}
