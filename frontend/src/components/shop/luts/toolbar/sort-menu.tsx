import { ArrowDownWideNarrow, ChevronDown } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LUT_SORT_LABEL, LUT_SORTS, type LutSort } from "@/lib/types/lut";

interface SortMenuProps {
  value: LutSort;
  onChange: (value: LutSort) => void;
}

export function SortMenu({ value, onChange }: SortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ShopButton
          variant="outline"
          size="sm"
          aria-label={`Sắp xếp: ${LUT_SORT_LABEL[value]}`}
          className="w-[169px] justify-between"
        >
          <span className="flex items-center gap-2">
            <ArrowDownWideNarrow className="size-4" />
            {LUT_SORT_LABEL[value]}
          </span>
          <ChevronDown className="size-4" />
        </ShopButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as LutSort)}>
          {LUT_SORTS.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              {LUT_SORT_LABEL[s]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
