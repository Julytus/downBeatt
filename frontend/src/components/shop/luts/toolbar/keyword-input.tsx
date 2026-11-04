import { Plus } from "lucide-react";
import { useState } from "react";

interface KeywordInputProps {
  onAdd: (keyword: string) => void;
}

/** Ô "Thêm từ khoá": Enter (hoặc nút +) để thêm một từ khoá lọc. */
export function KeywordInput({ onAdd }: KeywordInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const k = value.trim();
    if (k) onAdd(k);
    setValue("");
  };

  return (
    <div className="relative">
      <input
        aria-label="Thêm từ khoá"
        placeholder="Thêm từ khoá"
        value={value}
        maxLength={40}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className="h-8 w-40 rounded-full border border-(--sh-border) bg-transparent pr-8 pl-4 text-sm tracking-[0.04px] outline-none placeholder:text-(--sh-muted) focus:border-(--sh-muted)"
      />
      {value.trim() && (
        <button
          type="button"
          aria-label="Thêm"
          onClick={submit}
          className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-(--sh-muted) hover:bg-(--sh-surface) hover:text-(--sh-fg)"
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  );
}
