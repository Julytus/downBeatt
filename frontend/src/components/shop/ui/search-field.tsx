import { cva, type VariantProps } from "class-variance-authority";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const searchFieldVariants = cva("flex w-full items-center rounded-full transition-colors", {
  variants: {
    variant: {
      /** Ô tìm kiếm trên header */
      solid:
        "h-12 rounded-3xl border-2 border-transparent bg-(--sh-surface) pr-2 pl-5 text-(--sh-fg) focus-within:border-(--sh-border)",
      /** Ô tìm kiếm mờ đặt trên ảnh (hero) */
      glass:
        "h-[58px] gap-2 border border-white/15 bg-white/28 px-6 text-white backdrop-blur-sm focus-within:border-white/40"
    }
  },
  defaultVariants: { variant: "solid" }
});

interface SearchFieldProps extends VariantProps<typeof searchFieldVariants> {
  label: string;
  placeholder: string;
  defaultValue?: string;
  onSearch: (value: string) => void;
  className?: string;
}

/**
 * Ô tìm kiếm gửi khi bấm Enter hoặc nút kính lúp (không lọc theo từng phím).
 * Không kiểm soát giá trị: muốn đặt lại giá trị từ bên ngoài thì đổi `key`.
 */
export function SearchField({
  label,
  placeholder,
  defaultValue,
  onSearch,
  variant,
  className
}: SearchFieldProps) {
  const isGlass = variant === "glass";

  return (
    <form
      role="search"
      className={cn(searchFieldVariants({ variant }), className)}
      onSubmit={(e) => {
        e.preventDefault();
        const value = new FormData(e.currentTarget).get("q");
        onSearch(typeof value === "string" ? value.trim() : "");
      }}
    >
      <input
        name="q"
        type="search"
        aria-label={label}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent outline-none [&::-webkit-search-cancel-button]:hidden",
          isGlass ? "text-base placeholder:text-[#d9dbde]" : "text-sm tracking-[0.04px] placeholder:text-(--sh-muted)"
        )}
      />
      <button
        type="submit"
        aria-label="Tìm"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full transition-colors",
          isGlass ? "size-8 text-[#d9dbde] hover:bg-white/15" : "size-7 hover:bg-(--sh-surface-hover)"
        )}
      >
        <Search className={isGlass ? "size-5" : "size-4"} />
      </button>
    </form>
  );
}
