import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { ExternalLink, EyeOff, Film, MoreHorizontal, Pencil, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  LUT_STATUS_LABEL,
  LUT_STYLE_LABEL,
  type LutAdminItemDTO,
  type LutStatus
} from "@/lib/types/lut-admin";

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface CreateLutColumnsOptions {
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (item: LutAdminItemDTO) => void;
  onPublish: (id: number) => void;
  onHide: (item: LutAdminItemDTO) => void;
  onShowDeleteConfirm: (id: number, title?: string) => void;
}

export function createLutColumns({
  canUpdate,
  canDelete,
  onEdit,
  onPublish,
  onHide,
  onShowDeleteConfirm
}: CreateLutColumnsOptions): ColumnDef<LutAdminItemDTO>[] {
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
              <div className="size-10 rounded bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                <Film className="size-5" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <Link
                to="/admin/luts/$id"
                params={{ id: String(item.id) }}
                className="font-medium text-foreground hover:underline truncate"
              >
                {item.title}
              </Link>
              <span className="text-xs text-muted-foreground truncate">{item.slug}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "creatorName",
      header: "Tác giả",
      cell: ({ row }) => row.original.creatorName || "—"
    },
    {
      accessorKey: "style",
      header: "Phong cách",
      cell: ({ row }) => LUT_STYLE_LABEL[row.original.style] ?? row.original.style
    },
    {
      id: "isPremium",
      header: "Gói",
      cell: ({ row }) =>
        row.original.isPremium === 1 ? (
          <Badge>Premium</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Miễn phí</span>
        )
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
      accessorKey: "downloadCount",
      header: "Lượt tải",
      cell: ({ row }) => row.original.downloadCount.toLocaleString("vi-VN")
    },
    {
      accessorKey: "updatedTime",
      header: "Cập nhật",
      cell: ({ row }) => formatDateTime(row.original.updatedTime)
    },
    {
      id: "rowActions",
      header: () => <span className="sr-only">Thao tác</span>,
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        const canPublishItem =
          (item.status === "DRAFT" || item.status === "HIDDEN") && canUpdate;
        const canHideItem = item.status === "PUBLISHED" && canUpdate;
        const canViewInShop = item.status === "PUBLISHED";
        const canDeleteItem =
          (item.status === "DRAFT" || item.status === "HIDDEN") &&
          item.downloadCount === 0 &&
          canDelete;

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
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 size-4" />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>
              {canPublishItem && (
                <DropdownMenuItem onClick={() => onPublish(item.id)}>
                  <Upload className="mr-2 size-4" />
                  <span>Xuất bản</span>
                </DropdownMenuItem>
              )}
              {canHideItem && (
                <DropdownMenuItem onClick={() => onHide(item)}>
                  <EyeOff className="mr-2 size-4" />
                  <span>Ẩn</span>
                </DropdownMenuItem>
              )}
              {canViewInShop && (
                <DropdownMenuItem
                  onClick={() => window.open(`/luts/${item.slug}`, "_blank")}
                >
                  <ExternalLink className="mr-2 size-4" />
                  <span>Xem ở cửa hàng</span>
                </DropdownMenuItem>
              )}
              {canDeleteItem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onShowDeleteConfirm(item.id, item.title)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    <span>Xóa</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];
}
