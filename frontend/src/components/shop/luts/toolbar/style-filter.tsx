import { ChevronDown } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LUT_STYLE_LABEL, LUT_STYLES, type LutStyle } from "@/lib/types/lut";

interface StyleFilterProps {
  value: LutStyle[];
  onChange: (value: LutStyle[]) => void;
}

/** Menu "Phong cách" chọn nhiều; menu không đóng sau mỗi lần tick. */
export function StyleFilter({ value, onChange }: StyleFilterProps) {
  const toggle = (style: LutStyle, checked: boolean) =>
    onChange(checked ? [...value, style] : value.filter((v) => v !== style));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ShopButton variant="outline" size="sm">
          Phong cách
          {value.length > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-(--sh-pink) text-xs font-semibold text-white">
              {value.length}
            </span>
          )}
          <ChevronDown className="size-4" />
        </ShopButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {LUT_STYLES.map((style) => (
          <DropdownMenuCheckboxItem
            key={style}
            checked={value.includes(style)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(c) => toggle(style, c === true)}
          >
            {LUT_STYLE_LABEL[style]}
          </DropdownMenuCheckboxItem>
        ))}
        {value.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])}>Bỏ chọn tất cả</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
