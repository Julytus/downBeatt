import { type ColumnDef } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SYSTEM_RESOURCE_CODES, type ResourceDTO } from "@/lib/types/resource";

export const createResourceColumns = ({
  canUpdate,
  canDelete,
  moduleNames,
  onEdit,
  onShowDeleteConfirm,
  onToggleActive
}: {
  canUpdate: boolean;
  canDelete: boolean;
  /** id module → tên (từ `allModulesQueryOptions`) */
  moduleNames: Map<number, string>;
  onEdit: (resource: ResourceDTO) => void;
  onShowDeleteConfirm: (id: number, name?: string) => void;
  onToggleActive: (resource: ResourceDTO, active: boolean) => void;
}): ColumnDef<ResourceDTO>[] => [
  ...(canDelete
    ? [
        {
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Chọn tất cả"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={`Chọn ${row.original.name}`}
              />
            </div>
          ),
          enableSorting: false,
          enableHiding: false
        } satisfies ColumnDef<ResourceDTO>
      ]
    : []),
  {
    accessorKey: "name",
    header: "Tài nguyên",
    cell: ({ row }) => (
      <div className="flex flex-col truncate">
        <span className="text-foreground max-w-[220px] truncate font-bold tracking-tight">
          {row.original.name}
        </span>
        <span className="text-muted-foreground line-clamp-1 text-[11px] font-medium tracking-wider uppercase">
          {row.original.code}
        </span>
      </div>
    ),
    enableHiding: false
  },
  {
    accessorKey: "uri",
    header: "URI",
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.uri}</span>
  },
  {
    accessorKey: "moduleId",
    header: "Module",
    cell: ({ row }) => {
      const id = row.original.moduleId;
      const name = id == null ? undefined : moduleNames.get(id);
      return name ? (
        <span className="text-sm">{name}</span>
      ) : (
        <span className="text-muted-foreground text-sm">Chưa phân module</span>
      );
    }
  },
  {
    accessorKey: "actions",
    header: "Hành động hỗ trợ",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.actions.map((action) => (
          <Badge key={action} variant="secondary">
            {action}
          </Badge>
        ))}
      </div>
    )
  },
  {
    accessorKey: "active",
    header: "Kích hoạt",
    cell: ({ row }) => (
      <Switch
        checked={row.original.active === 1}
        disabled={!canUpdate}
        onCheckedChange={(checked) => onToggleActive(row.original, checked)}
        aria-label={`Bật hoặc tắt tài nguyên ${row.original.name}`}
      />
    )
  },
  {
    id: "rowActions",
    header: () => <span className="sr-only">Thao tác</span>,
    enableHiding: false,
    cell: ({ row }) => {
      // Tài nguyên hệ thống: backend không cho xoá
      const deletable = canDelete && !SYSTEM_RESOURCE_CODES.includes(row.original.code);
      if (!canUpdate && !deletable) return null;
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
                size="icon"
                aria-label={`Thao tác ${row.original.name}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(row.original)}>Chỉnh sửa</DropdownMenuItem>
              )}
              {deletable && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onShowDeleteConfirm(row.original.id, row.original.name)}
                  >
                    Xóa
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
  }
];
