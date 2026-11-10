import * as React from "react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { FieldError } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { lutCreatorsQueryOptions } from "@/lib/tanstack/options/lut-admin";
import {
  LUT_STYLE_LABEL,
  LUT_STYLES,
  type LutUpsertApiRequest
} from "@/lib/types/lut-admin";
import { toFieldErrors } from "@/lib/utils/form-errors";

const createLutSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(150, "Tiêu đề tối đa 150 ký tự"),
  creatorId: z.string().min(1, "Vui lòng chọn tác giả"),
  style: z.string().min(1, "Vui lòng chọn phong cách")
});

export interface LutCreateDialogProps {
  open: boolean;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LutUpsertApiRequest) => void;
}

export function LutCreateDialog({
  open,
  isLoading,
  onOpenChange,
  onSubmit
}: LutCreateDialogProps) {
  const [title, setTitle] = React.useState("");
  const [creatorId, setCreatorId] = React.useState("");
  const [style, setStyle] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const { data: creators = [] } = useQuery({
    ...lutCreatorsQueryOptions,
    enabled: open
  });

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setCreatorId("");
      setStyle("");
      setErrors({});
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createLutSchema.safeParse({ title, creatorId, style });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onSubmit({
      title: parsed.data.title,
      creatorId: Number(parsed.data.creatorId),
      style: parsed.data.style
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm LUT"
      featured="Tạo bản nháp, sau đó điền thông tin và tải file ở trang chi tiết."
      onSubmit={handleSubmit}
      submitLabel="Tạo mới"
      cancelLabel="Hủy"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lut-create-title">Tiêu đề</Label>
          <Input
            ref={titleInputRef}
            id="lut-create-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!errors.title}
            autoFocus
          />
          <FieldError>{errors.title}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lut-create-creator">Tác giả</Label>
          <Select value={creatorId} onValueChange={setCreatorId}>
            <SelectTrigger
              id="lut-create-creator"
              aria-label="Tác giả"
              aria-invalid={!!errors.creatorId}
              className="w-full"
            >
              <SelectValue placeholder="Chọn tác giả" />
            </SelectTrigger>
            <SelectContent>
              {creators.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                  {c.status === 0 ? " (đang ẩn)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{errors.creatorId}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lut-create-style">Phong cách</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger
              id="lut-create-style"
              aria-label="Phong cách"
              aria-invalid={!!errors.style}
              className="w-full"
            >
              <SelectValue placeholder="Chọn phong cách" />
            </SelectTrigger>
            <SelectContent>
              {LUT_STYLES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LUT_STYLE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{errors.style}</FieldError>
        </div>
      </div>
    </FormDialog>
  );
}
