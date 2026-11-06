import * as React from "react";
import { z } from "zod";

import { FieldError } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ModuleDTO, ModuleUpsertApiRequest } from "@/lib/types/module";
import { toFieldErrors } from "@/lib/utils/form-errors";

// Giới hạn theo cột bảng `module` (V1__auth_schema.sql). Backend không kiểm định dạng.
const moduleSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên module").max(300, "Tên module tối đa 300 ký tự"),
  code: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập code")
    .max(100, "Code tối đa 100 ký tự")
    .regex(/^[A-Z0-9_]+$/, "Code chỉ gồm chữ in hoa, số và dấu _"),
  description: z.string().trim().max(300, "Mô tả tối đa 300 ký tự")
});

export function ModuleFormDialog({
  open,
  module,
  isLoading,
  onOpenChange,
  onSubmit
}: {
  open: boolean;
  module: ModuleDTO | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ModuleUpsertApiRequest) => void;
}) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setName(module?.name ?? "");
    setCode(module?.code ?? "");
    setDescription(module?.description ?? "");
    setActive(module?.active !== 0);
    setErrors({});
  }, [module, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = moduleSchema.safeParse({ name, code, description });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onSubmit({
      id: module?.id,
      ...parsed.data,
      description: parsed.data.description || null,
      active: active ? 1 : 0
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={module ? "Chỉnh sửa module" : "Tạo mới module"}
      featured={module ? "Cập nhật thông tin module" : "Tạo module mới để nhóm tài nguyên"}
      onSubmit={handleSubmit}
      submitLabel={module ? "Cập nhật" : "Tạo mới"}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="module-name">Tên module</Label>
        <Input
          id="module-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={!!errors.name}
        />
        <FieldError>{errors.name}</FieldError>
      </div>
      <div className="space-y-2">
        <Label htmlFor="module-code">Code</Label>
        <Input
          id="module-code"
          name="code"
          value={code}
          placeholder="Ví dụ: SYSTEM"
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          aria-invalid={!!errors.code}
        />
        <FieldError>{errors.code}</FieldError>
      </div>
      <div className="space-y-2">
        <Label htmlFor="module-description">Mô tả</Label>
        <Textarea
          id="module-description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-[80px]"
          aria-invalid={!!errors.description}
        />
        <FieldError>{errors.description}</FieldError>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="module-active">Đang kích hoạt</Label>
        <Switch id="module-active" checked={active} onCheckedChange={setActive} />
      </div>
    </FormDialog>
  );
}
