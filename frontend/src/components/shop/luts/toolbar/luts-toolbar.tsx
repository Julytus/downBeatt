import { FilterChip } from "@/components/shop/ui/filter-chip";
import { LUT_STYLE_LABEL, type LutSort, type LutStyle } from "@/lib/types/lut";
import { KeywordInput } from "./keyword-input";
import { SortMenu } from "./sort-menu";
import { StyleFilter } from "./style-filter";

export interface LutsToolbarValue {
  q?: string;
  keywords: string[];
  styles: LutStyle[];
  sort: LutSort;
}

interface LutsToolbarProps {
  value: LutsToolbarValue;
  onChange: (patch: Partial<LutsToolbarValue>) => void;
}

/** Thanh lọc: từ khoá + phong cách bên trái, các nhãn đang lọc, sắp xếp bên phải. */
export function LutsToolbar({ value, onChange }: LutsToolbarProps) {
  const { q, keywords, styles, sort } = value;

  return (
    <section aria-label="Bộ lọc" className="flex flex-wrap items-center gap-3">
      <KeywordInput
        onAdd={(k) => !keywords.includes(k) && onChange({ keywords: [...keywords, k] })}
      />
      <span aria-hidden className="h-6 w-px bg-(--sh-border)" />
      <StyleFilter value={styles} onChange={(next) => onChange({ styles: next })} />

      {q && <FilterChip label={`“${q}”`} onRemove={() => onChange({ q: undefined })} />}
      {keywords.map((k) => (
        <FilterChip
          key={`kw-${k}`}
          label={k}
          onRemove={() => onChange({ keywords: keywords.filter((x) => x !== k) })}
        />
      ))}
      {styles.map((s) => (
        <FilterChip
          key={`st-${s}`}
          label={LUT_STYLE_LABEL[s]}
          onRemove={() => onChange({ styles: styles.filter((x) => x !== s) })}
        />
      ))}

      <div className="ml-auto">
        <SortMenu value={sort} onChange={(next) => onChange({ sort: next })} />
      </div>
    </section>
  );
}
