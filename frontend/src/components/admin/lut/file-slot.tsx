import * as React from "react";
import { Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { createUploadLutFileMutationOptions } from "@/lib/tanstack/options/lut-admin";
import {
  LUT_UPLOAD_RULES,
  type LutUploadKind
} from "@/lib/types/lut-admin";

export interface FileSlotProps {
  lutId: number;
  kind: LutUploadKind;
  currentUrl?: string;
  canUpdate: boolean;
  lutSize?: number;
  fileSizeKb?: number;
}

export function FileSlot({
  lutId,
  kind,
  currentUrl,
  canUpdate,
  lutSize,
  fileSizeKb
}: FileSlotProps) {
  const rule = LUT_UPLOAD_RULES[kind];
  const queryClient = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState("");

  const uploadMutation = useMutation(
    createUploadLutFileMutationOptions(queryClient, kind)
  );
  const isUploading = uploadMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const hasAllowedExt = rule.allowedExtensions.some((ext) =>
      lowerName.endsWith(ext)
    );

    if (!hasAllowedExt) {
      setError(rule.errorWrongExt);
      return;
    }

    if (file.size > rule.maxSizeBytes) {
      setError(rule.errorTooLarge);
      return;
    }

    setError("");
    uploadMutation.mutate({ id: lutId, file });
  };

  const handleButtonClick = () => {
    setError("");
    inputRef.current?.click();
  };

  // Trường hợp kind === "CUBE"
  if (kind === "CUBE") {
    const hasCube = Boolean(lutSize || fileSizeKb);
    const buttonText = isUploading
      ? "Đang tải lên…"
      : hasCube
      ? "Thay file .cube"
      : "Tải file .cube";

    return (
      <div className="space-y-3">
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          aria-label={`Chọn file ${rule.slotName}`}
          accept={rule.accept}
          onChange={handleFileChange}
          disabled={!canUpdate || isUploading}
        />

        <div className="flex items-center justify-between">
          <div>
            {hasCube ? (
              <p className="text-sm font-medium">
                LUT {lutSize ?? 0}³ · {fileSizeKb ?? 0} KB
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có file .cube</p>
            )}
          </div>

          {canUpdate && (
            <Button
              type="button"
              variant={hasCube ? "outline" : "default"}
              size="sm"
              disabled={isUploading}
              onClick={handleButtonClick}
            >
              <Upload className="mr-1.5 size-4" />
              {buttonText}
            </Button>
          )}
        </div>

        <FieldError>{error}</FieldError>
      </div>
    );
  }

  // Trường hợp kind là ảnh hoặc video (COVER, BEFORE, AFTER, VIDEO)
  const hasMedia = Boolean(currentUrl);
  const buttonText = isUploading ? "Đang tải lên…" : hasMedia ? "Thay" : "Tải lên";

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        aria-label={`Chọn file ${rule.slotName}`}
        accept={rule.accept}
        onChange={handleFileChange}
        disabled={!canUpdate || isUploading}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{rule.slotName}</span>
        {canUpdate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={isUploading}
            onClick={handleButtonClick}
          >
            <Upload className="mr-1 size-3.5" />
            {buttonText}
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-md border bg-muted/30">
        {kind === "VIDEO" ? (
          hasMedia ? (
            <video
              src={currentUrl}
              controls
              muted
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="aspect-video w-full flex items-center justify-center text-xs text-muted-foreground border-dashed">
              Chưa có
            </div>
          )
        ) : hasMedia ? (
          <img
            src={currentUrl}
            alt={rule.slotName}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="aspect-video w-full flex items-center justify-center text-xs text-muted-foreground border-dashed">
            Chưa có
          </div>
        )}
      </div>

      <FieldError>{error}</FieldError>
    </div>
  );
}
