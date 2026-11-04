import { Link } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SHOP_NAV_GROUPS, type ShopNavItem } from "./nav-config";

const itemClass =
  "flex h-8 w-full items-center gap-3 rounded-[8px] px-3 text-sm tracking-[0.04px] text-(--sh-nav) transition-colors outline-none hover:bg-(--sh-surface) focus-visible:ring-2 focus-visible:ring-(--sh-pink)/60 " +
  "data-[status=active]:bg-(--sh-active-bg) data-[status=active]:font-semibold data-[status=active]:text-(--sh-active-fg)";

interface SidebarNavProps {
  collapsed?: boolean;
  /** Gọi sau khi bấm một mục (menu mobile dùng để tự đóng) */
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Danh mục" className="flex-1 overflow-y-auto px-3 [scrollbar-width:none]">
      {SHOP_NAV_GROUPS.map((group, i) => (
        <ul
          key={group[0].id}
          className={cn("flex flex-col gap-1.5", i > 0 && "mt-4 border-t border-(--sh-border) pt-4")}
        >
          {group.map((item) => (
            <li key={item.id}>
              <SidebarNavItem item={item} collapsed={collapsed} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      ))}
    </nav>
  );
}

function SidebarNavItem({
  item,
  collapsed,
  onNavigate
}: {
  item: ShopNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const content = (
    <>
      <item.icon className="size-4 shrink-0" aria-hidden />
      <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
    </>
  );
  const className = cn(itemClass, collapsed && "justify-center px-0");

  const link = item.to ? (
    <Link to={item.to} onClick={onNavigate} className={className}>
      {content}
    </Link>
  ) : (
    <a
      href="#"
      aria-disabled
      onClick={(e) => e.preventDefault()}
      title={collapsed ? undefined : "Sắp ra mắt"}
      className={className}
    >
      {content}
    </a>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {item.label}
        {!item.to && " (sắp ra mắt)"}
      </TooltipContent>
    </Tooltip>
  );
}
