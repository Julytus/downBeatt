import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

/** Nhãn bộ lọc đang áp dụng, có nút bỏ. */
export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex h-8 max-w-60 items-center gap-1 rounded-full bg-(--sh-surface) pr-1.5 pl-3 text-sm">
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={`Bỏ lọc ${label}`}
        onClick={onRemove}
        className="flex size-5 shrink-0 items-center justify-center rounded-full hover:bg-(--sh-surface-hover)"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
