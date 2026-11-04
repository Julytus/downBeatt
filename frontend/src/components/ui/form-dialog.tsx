"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  featured?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  loadingLabel?: string;
  cancelLabel?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  featured,
  children,
  onSubmit,
  submitLabel = "Lưu",
  loadingLabel = "Đang xử lý...",
  cancelLabel = "Hủy",
  maxWidth = "lg",
  isLoading = false
}: FormDialogProps) {
  const maxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl"
  }[maxWidth];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`gap-0 p-0 ${maxWidthClass} max-h-[90vh] flex flex-col overflow-hidden`}>
        <DialogHeader className="border-b px-6 py-4 pt-5 shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {featured && <DialogDescription>{featured}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="space-y-6 p-6 overflow-y-auto flex-1">{children}</div>

          <div className="flex items-center justify-end space-x-2 border-t p-4 shrink-0 bg-background">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isLoading}>
                {cancelLabel}
              </Button>
            </DialogClose>
            <Button size="sm" type="submit" disabled={isLoading}>
              {isLoading ? loadingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
