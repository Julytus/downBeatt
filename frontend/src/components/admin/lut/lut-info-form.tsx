import * as React from "react";
import { z } from "zod";

import { useAppForm } from "@/components/form/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CategoryCheckboxes } from "@/components/admin/lut/category-checkboxes";
import { TagInput } from "@/components/admin/lut/tag-input";
import type { LutCategoryDTO } from "@/lib/types/lut";
import {
  LUT_STYLE_LABEL,
  LUT_STYLES,
  type CreatorOptionDTO,
  type LutAdminDetailDTO,
  type LutUpsertApiRequest
} from "@/lib/types/lut-admin";

const lutInfoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(150, "Tiêu đề tối đa 150 ký tự"),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional(),
  creatorId: z.string().min(1, "Vui lòng chọn tác giả"),
  style: z.string().min(1, "Vui lòng chọn phong cách"),
  isPremium: z.boolean(),
  tags: z.array(z.string()),
  categories: z.array(z.string()),
  previewType: z.enum(["BEFORE_AFTER", "VIDEO"])
});

export type LutInfoFormData = z.infer<typeof lutInfoSchema>;

function getFormValuesFromDetail(detail: LutAdminDetailDTO): LutInfoFormData {
  return {
    title: detail.title ?? "",
    description: detail.description ?? "",
    creatorId: detail.creatorId ? String(detail.creatorId) : "",
    style: detail.style ?? "",
    isPremium: detail.isPremium === 1,
    tags: detail.tags ?? [],
    categories: detail.categories ?? [],
    previewType: detail.previewType ?? "BEFORE_AFTER"
  };
}

function formatFieldError(errors: unknown[]): string | undefined {
  if (!errors || errors.length === 0) return undefined;
  const first = errors[0];
  if (typeof first === "string") return first;
  if (typeof first === "object" && first !== null) {
    if ("message" in first && typeof (first as { message: unknown }).message === "string") {
      return (first as { message: string }).message;
    }
  }
  return String(first);
}

export interface LutInfoFormProps {
  detail: LutAdminDetailDTO;
  creators: CreatorOptionDTO[];
  allCategories: LutCategoryDTO[];
  canUpdate: boolean;
  isSubmitting?: boolean;
  onActivePreviewTypeChange: (type: "BEFORE_AFTER" | "VIDEO") => void;
  onSubmit: (values: LutUpsertApiRequest) => Promise<LutAdminDetailDTO | void> | void;
}

export function LutInfoForm({
  detail,
  creators,
  allCategories,
  canUpdate,
  isSubmitting,
  onActivePreviewTypeChange,
  onSubmit
}: LutInfoFormProps) {
  const form = useAppForm({
    defaultValues: getFormValuesFromDetail(detail),
    validators: {
      onSubmit: lutInfoSchema
    },
    onSubmit: async ({ value }) => {
      const payload: LutUpsertApiRequest = {
        id: detail.id,
        title: value.title.trim(),
        description: value.description?.trim() || undefined,
        creatorId: Number(value.creatorId),
        style: value.style,
        isPremium: value.isPremium ? 1 : 0,
        previewType: value.previewType,
        tags: value.tags,
        categories: value.categories
      };

      const result = await onSubmit(payload);
      if (result) {
        form.reset(getFormValuesFromDetail(result));
      }
    }
  });

  const detailIdRef = React.useRef(detail.id);
  React.useEffect(() => {
    if (detail.id !== detailIdRef.current) {
      detailIdRef.current = detail.id;
      const nextValues = getFormValuesFromDetail(detail);
      form.reset(nextValues);
      onActivePreviewTypeChange(nextValues.previewType);
    }
  }, [detail.id, detail, form, onActivePreviewTypeChange]);

  return (
    <Card data-slot="card">
      <CardHeader>
        <CardTitle>Thông tin</CardTitle>
        <CardDescription>
          Chỉnh sửa thông tin chi tiết của LUT
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          noValidate
          className="space-y-6"
        >
          {/* Tiêu đề */}
          <form.Field name="title">
            {(field) => {
              const err = formatFieldError(field.state.meta.errors);
              return (
                <div className="space-y-2">
                  <Label htmlFor="lut-info-title">Tiêu đề</Label>
                  <Input
                    id="lut-info-title"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={!canUpdate}
                    aria-invalid={Boolean(err)}
                  />
                  <FieldError>{err}</FieldError>
                </div>
              );
            }}
          </form.Field>

          {/* Mô tả */}
          <form.Field name="description">
            {(field) => {
              const err = formatFieldError(field.state.meta.errors);
              const val = field.state.value ?? "";
              return (
                <div className="space-y-2">
                  <Label htmlFor="lut-info-description">Mô tả</Label>
                  <Textarea
                    id="lut-info-description"
                    rows={4}
                    value={val}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={!canUpdate}
                    aria-invalid={Boolean(err)}
                  />
                  <div className="flex justify-between items-center text-xs">
                    <FieldError>{err}</FieldError>
                    <span className="text-muted-foreground ml-auto">
                      {val.length}/1000
                    </span>
                  </div>
                </div>
              );
            }}
          </form.Field>

          {/* Tác giả */}
          <form.Field name="creatorId">
            {(field) => {
              const err = formatFieldError(field.state.meta.errors);
              return (
                <div className="space-y-2">
                  <Label htmlFor="lut-info-creator">Tác giả</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                    disabled={!canUpdate}
                  >
                    <SelectTrigger
                      id="lut-info-creator"
                      aria-label="Tác giả"
                      aria-invalid={Boolean(err)}
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
                  <FieldError>{err}</FieldError>
                </div>
              );
            }}
          </form.Field>

          {/* Phong cách */}
          <form.Field name="style">
            {(field) => {
              const err = formatFieldError(field.state.meta.errors);
              return (
                <div className="space-y-2">
                  <Label htmlFor="lut-info-style">Phong cách</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                    disabled={!canUpdate}
                  >
                    <SelectTrigger
                      id="lut-info-style"
                      aria-label="Phong cách"
                      aria-invalid={Boolean(err)}
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
                  <FieldError>{err}</FieldError>
                </div>
              );
            }}
          </form.Field>

          {/* LUT Premium */}
          <form.Field name="isPremium">
            {(field) => (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="lut-info-premium" className="cursor-pointer">
                    LUT Premium
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Chỉ gói Pro, Studio tải được
                  </p>
                </div>
                <Switch
                  id="lut-info-premium"
                  aria-label="LUT Premium"
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  disabled={!canUpdate}
                />
              </div>
            )}
          </form.Field>

          {/* Thẻ */}
          <form.Field name="tags">
            {(field) => (
              <TagInput
                value={field.state.value}
                onChange={(tags) => field.handleChange(tags)}
                disabled={!canUpdate}
              />
            )}
          </form.Field>

          {/* Danh mục */}
          <form.Field name="categories">
            {(field) => (
              <CategoryCheckboxes
                value={field.state.value}
                onChange={(cats) => field.handleChange(cats)}
                categories={allCategories}
                disabled={!canUpdate}
              />
            )}
          </form.Field>

          {/* Kiểu xem trước */}
          <form.Field name="previewType">
            {(field) => (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kiểu xem trước</Label>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(val) => {
                    const next = val as "BEFORE_AFTER" | "VIDEO";
                    field.handleChange(next);
                    onActivePreviewTypeChange(next);
                  }}
                  disabled={!canUpdate}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="BEFORE_AFTER"
                      id="preview-before-after"
                      aria-label="Ảnh trước / sau"
                    />
                    <Label
                      htmlFor="preview-before-after"
                      className="cursor-pointer font-normal"
                    >
                      Ảnh trước / sau
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="VIDEO"
                      id="preview-video"
                      aria-label="Video"
                    />
                    <Label
                      htmlFor="preview-video"
                      className="cursor-pointer font-normal"
                    >
                      Video
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </form.Field>

          {/* Submit button (chỉ hiện khi có quyền UPDATE) */}
          {canUpdate && (
            <Button
              type="submit"
              disabled={isSubmitting || form.state.isSubmitting}
              className="w-full"
            >
              {isSubmitting || form.state.isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
