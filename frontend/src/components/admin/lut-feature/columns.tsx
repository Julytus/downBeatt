import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, RotateCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { FeatureBar } from "@/components/admin/lut/feature-bar";
import { FEATURE_ROW_BY_KEY } from "@/lib/lut-feature/feature-rows";
import {
  LUT_STATUS_LABEL,
  LUT_STYLE_LABEL,
  type LutFeatureItemDTO,
  type LutStatus
} from "@/lib/types/lut-feature";

function formatDateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function createLutFeatureColumns({
  canUpdate,
  onView,
  onRecompute
}: {
  canUpdate: boolean;
  onView: (item: LutFeatureItemDTO) => void;
  onRecompute: (id: number) => void;
}): ColumnDef<LutFeatureItemDTO>[] {
  return [
    {
      accessorKey: "title",
      id: "title",
      header: "LUT",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            {item.coverUrl ? (
              <img
                src={item.coverUrl}
                alt=""
                className="size-10 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="size-10 rounded bg-muted flex-shrink-0" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-foreground truncate">{item.title}</span>
              <span className="text-xs text-muted-foreground truncate">{item.slug}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "style",
      header: "Phong cách",
      cell: ({ row }) => LUT_STYLE_LABEL[row.original.style] ?? row.original.style
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.original.status as LutStatus;
        const variant =
          status === "PUBLISHED" ? "default" : status === "HIDDEN" ? "secondary" : "outline";
        return <Badge variant={variant}>{LUT_STATUS_LABEL[status] ?? status}</Badge>;
      }
    },
    {
      id: "warmth",
      header: "Nhiệt độ",
      cell: ({ row }) => {
        const feature = row.original.colorFeature;
        if (!feature) return <span className="text-muted-foreground">—</span>;
        return <FeatureBar row={FEATURE_ROW_BY_KEY.warmth} value={feature.warmth} compact />;
      }
    },
    {
      id: "saturation",
      header: "Bão hoà",
      cell: ({ row }) => {
        const feature = row.original.colorFeature;
        if (!feature) return <span className="text-muted-foreground">—</span>;
        return (
          <FeatureBar row={FEATURE_ROW_BY_KEY.saturation} value={feature.saturation} compact />
        );
      }
    },
    {
      id: "contrast",
      header: "Tương phản",
      cell: ({ row }) => {
        const feature = row.original.colorFeature;
        if (!feature) return <span className="text-muted-foreground">—</span>;
        return <FeatureBar row={FEATURE_ROW_BY_KEY.contrast} value={feature.contrast} compact />;
      }
    },
    {
      id: "isMono",
      header: "Đen trắng",
      cell: ({ row }) => (row.original.colorFeature?.isMono === 1 ? "Có" : "—")
    },
    {
      id: "computedTime",
      header: "Tính lúc",
      cell: ({ row }) => {
        const time = row.original.colorFeature?.computedTime;
        if (!time) {
          return (
            <span className="text-amber-600 dark:text-amber-500 font-medium text-xs">
              Chưa tính
            </span>
          );
        }
        return <span className="text-sm">{formatDateTime(time)}</span>;
      }
    },
    {
      id: "rowActions",
      header: () => <span className="sr-only">Thao tác</span>,
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 p-0"
                aria-label={`Thao tác ${item.title}`}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(item)}>
                <Eye className="mr-2 size-4" />
                <span>Xem đặc trưng</span>
              </DropdownMenuItem>
              {canUpdate && (
                <DropdownMenuItem onClick={() => onRecompute(item.id)}>
                  <RotateCw className="mr-2 size-4" />
                  <span>Tính lại</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];
}
