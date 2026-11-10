import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { LutCategoryDTO, LutCategoryGroup } from "@/lib/types/lut";

export interface CategoryCheckboxesProps {
  value: string[];
  onChange: (categories: string[]) => void;
  categories: LutCategoryDTO[];
  disabled?: boolean;
}

const GROUPS: { code: LutCategoryGroup; label: string }[] = [
  { code: "phong-cach", label: "Phong cách" },
  { code: "tong-mau", label: "Tông màu" },
  { code: "dip", label: "Dịp" },
  { code: "phan-mem", label: "Phần mềm" }
];

export function CategoryCheckboxes({
  value = [],
  onChange,
  categories = [],
  disabled
}: CategoryCheckboxesProps) {
  const handleToggle = (slug: string, checked: boolean) => {
    if (checked) {
      if (!value.includes(slug)) {
        onChange([...value, slug]);
      }
    } else {
      onChange(value.filter((s) => s !== slug));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Danh mục</Label>
        <span className="text-xs text-muted-foreground">
          Cần ít nhất 1 danh mục ngoài nhóm Phần mềm để xuất bản
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/20">
        {GROUPS.map((group) => {
          const groupCategories = categories.filter((c) => c.group === group.code);
          return (
            <div key={group.code} className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </h4>
              <div className="space-y-1.5">
                {groupCategories.map((cat) => {
                  const isChecked = value.includes(cat.slug);
                  return (
                    <div key={cat.slug} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat.slug}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleToggle(cat.slug, !!checked)}
                        aria-label={cat.name}
                        disabled={disabled}
                      />
                      <label
                        htmlFor={`cat-${cat.slug}`}
                        className="text-sm cursor-pointer select-none font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {cat.name}
                      </label>
                    </div>
                  );
                })}
                {groupCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Không có danh mục</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
