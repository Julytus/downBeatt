import * as React from "react";
import { z } from "zod";

import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RESOURCE_ACTIONS,
  SYSTEM_RESOURCE_CODES,
  type ResourceDTO,
  type ResourceUpsertApiRequest
} from "@/lib/types/resource";
import { toFieldErrors } from "@/lib/utils/form-errors";

// Giới hạn theo cột bảng `resource`. `uri` phải trùng hằng URI của controller ("/lut-category/").
const resourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên tài nguyên")
    .max(300, "Tên tài nguyên tối đa 300 ký tự"),
  description: z.string().trim().max(300, "Mô tả tối đa 300 ký tự"),
  code: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập code")
    .max(100, "Code tối đa 100 ký tự")
    .regex(/^[A-Z0-9_]+$/, "Code chỉ gồm chữ in hoa, số và dấu _"),
  uri: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập URI")
    .max(300, "URI tối đa 300 ký tự")
    .regex(/^\/[a-z0-9-]+\/$/, "URI có dạng /ten-tai-nguyen/ (chữ thường, số, dấu -)"),
  actions: z.array(z.enum(RESOURCE_ACTIONS)).min(1, "Chọn ít nhất một hành động")
});

export function ResourceFormDialog({
  open,
  resource,
  isLoading,
  onOpenChange,
  onSubmit
}: {
  open: boolean;
  resource: ResourceDTO | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ResourceUpsertApiRequest) => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [code, setCode] = React.useState("");
  const [uri, setUri] = React.useState("");
  const [actions, setActions] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setName(resource?.name ?? "");
    setDescription(resource?.description ?? "");
    setCode(resource?.code ?? "");
    setUri(resource?.uri ?? "");
    setActions(resource?.actions ?? ["VIEW"]);
    setErrors({});
  }, [resource, open]);

  const isSystemResource = !!resource && SYSTEM_RESOURCE_CODES.includes(resource.code);

  const toggleAction = (action: string, checked: boolean) => {
    setActions((prev) => (checked ? [...prev, action] : prev.filter((a) => a !== action)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Giữ thứ tự VIEW, ADD, UPDATE, DELETE; action lạ (cấp từ migration) không sửa ở đây
    const ordered = RESOURCE_ACTIONS.filter((a) => actions.includes(a));
    const parsed = resourceSchema.safeParse({ name, description, code, uri, actions: ordered });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const extra = (resource?.actions ?? []).filter(
      (a) => !(RESOURCE_ACTIONS as readonly string[]).includes(a)
    );
    onSubmit({
      id: resource?.id,
      ...parsed.data,
      description: parsed.data.description || null,
      actions: [...parsed.data.actions, ...extra],
      active: resource?.active ?? 1
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={resource ? "Chỉnh sửa tài nguyên" : "Tạo mới tài nguyên"}
      featured={
        resource
          ? "Cập nhật thông tin tài nguyên hệ thống"
          : "Tạo tài nguyên mới để gán quyền cho các chức vụ"
      }
      onSubmit={handleSubmit}
      submitLabel={resource ? "Cập nhật" : "Tạo mới"}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="resource-name">Tên tài nguyên</Label>
        <Input
          id="resource-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
        />
        <FieldError>{errors.name}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resource-description">Mô tả</Label>
        <Textarea
          id="resource-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[80px]"
          aria-invalid={!!errors.description}
        />
        <FieldError>{errors.description}</FieldError>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="resource-code">Code</Label>
          <Input
            id="resource-code"
            name="code"
            value={code}
            placeholder="Ví dụ: LUT_CATEGORY"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isSystemResource}
            aria-invalid={!!errors.code}
          />
          <FieldError>{errors.code}</FieldError>
        </div>
        <div className="space-y-2">
          <Label htmlFor="resource-uri">URI</Label>
          <Input
            id="resource-uri"
            name="uri"
            value={uri}
            placeholder="Ví dụ: /lut-category/"
            onChange={(e) => setUri(e.target.value)}
            disabled={isSystemResource}
            aria-invalid={!!errors.uri}
          />
          <FieldError>{errors.uri}</FieldError>
        </div>
      </div>
      {isSystemResource && (
        <p className="text-muted-foreground text-xs">
          Đây là tài nguyên hệ thống — không thể sửa Code/URI vì phân quyền khớp theo URI này.
        </p>
      )}

      <div className="space-y-2">
        <Label>Hành động hỗ trợ</Label>
        <div className="flex flex-wrap gap-4">
          {RESOURCE_ACTIONS.map((action) => (
            <label key={action} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={actions.includes(action)}
                onCheckedChange={(checked) => toggleAction(action, checked === true)}
                aria-label={`Hành động ${action}`}
              />
              {action}
            </label>
          ))}
        </div>
        <FieldError>{errors.actions}</FieldError>
      </div>
    </FormDialog>
  );
}
