import * as React from "react";
import { Loader2, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { LutColorFeatureCard } from "@/components/admin/lut/lut-color-feature-card";
import { LUT_STYLE_LABEL, type LutFeatureItemDTO } from "@/lib/types/lut-feature";

function formatDateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface LutFeatureSheetProps {
  item: LutFeatureItemDTO | null;
  open: boolean;
  canUpdate: boolean;
  isRecomputing?: boolean;
  onOpenChange: (open: boolean) => void;
  onRecompute: (id: number) => void;
}

export function LutFeatureSheet({
  item,
  open,
  canUpdate,
  isRecomputing = false,
  onOpenChange,
  onRecompute
}: LutFeatureSheetProps) {
  if (!item) return null;

  const styleLabel = LUT_STYLE_LABEL[item.style] ?? item.style;
  const description = item.lutSize ? `${styleLabel} · LUT ${item.lutSize}³` : styleLabel;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item.title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          {item.coverUrl ? (
            <img
              src={item.coverUrl}
              alt={item.title}
              className="w-full aspect-video rounded-lg object-cover"
            />
          ) : (
            <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
              Chưa có ảnh bìa
            </div>
          )}

          {item.colorFeature ? (
            <>
              <LutColorFeatureCard feature={item.colorFeature} />
              <p className="text-sm text-muted-foreground">
                Tính lúc {formatDateTime(item.colorFeature.computedTime)}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center">
              <h3 className="font-semibold text-foreground">Chưa có đặc trưng màu</h3>
              <p className="text-sm text-muted-foreground">
                Bấm Tính lại để đọc file .cube của LUT này.
              </p>
            </div>
          )}
        </div>

        {canUpdate && (
          <SheetFooter>
            <Button
              className="w-full"
              onClick={() => onRecompute(item.id)}
              disabled={isRecomputing}
            >
              {isRecomputing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang tính…
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 size-4" />
                  Tính lại
                </>
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
