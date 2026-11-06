import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Search, Star, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createLutSuggestionsQueryOptions } from "@/lib/tanstack/options/luts";
import { cn } from "@/lib/utils";

/** Từ khoá gợi ý khi ô tìm kiếm trống / không có kết quả */
const POPULAR_SEARCHES = ["điện ảnh", "phim", "teal", "cưới", "đêm", "vintage", "du lịch"];

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Ô tìm kiếm trên header. Bấm vào hiện bảng gợi ý: từ khoá phổ biến + tối đa 4 LUT khớp
 * (cập nhật theo từng phím, trễ 200ms). Enter → trang /luts?q=…
 */
export function HeaderSearch({ className }: { className?: string }) {
  const { q } = useSearch({ strict: false });
  return <HeaderSearchInner key={q ?? ""} initial={q ?? ""} className={className} />;
}

function HeaderSearchInner({ initial, className }: { initial: string; className?: string }) {
  const navigate = useNavigate();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);

  const term = useDebounced(value.trim(), 200);
  const suggestions = useQuery({ ...createLutSuggestionsQueryOptions(term), enabled: open });

  // Đóng khi bấm ra ngoài
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const submit = (text: string) => {
    setOpen(false);
    inputRef.current?.blur();
    navigate({ to: "/luts", search: (prev) => ({ ...prev, q: text.trim() || undefined }) });
  };

  const items = suggestions.data ?? [];
  const noResults = !!term && suggestions.isSuccess && !suggestions.isPlaceholderData && items.length === 0;

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          // Chặn hành vi mặc định của input type=search (tự xoá chữ → onChange mở lại bảng gợi ý)
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          inputRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        // Rời hẳn khỏi ô tìm kiếm + bảng gợi ý bằng Tab
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className={cn(
          "flex h-12 w-full items-center rounded-3xl border-2 border-transparent bg-(--sh-surface) pr-2 pl-5 transition-colors",
          open && "border-(--sh-border) bg-(--sh-elevated)"
        )}
      >
        <input
          ref={inputRef}
          name="q"
          type="search"
          aria-label="Tìm kiếm"
          aria-controls={open ? panelId : undefined}
          placeholder="Tìm theo phong cách, tác giả hoặc cảm xúc"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Đã focus sẵn (vừa Esc đóng bảng) thì bấm lại vẫn mở
          onClick={() => setOpen(true)}
          className="h-full min-w-0 flex-1 bg-transparent text-sm tracking-[0.04px] outline-none placeholder:text-(--sh-muted) [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Xoá từ khoá"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-(--sh-surface-hover)"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Tìm"
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
            value ? "bg-(--sh-primary) text-white hover:bg-(--sh-primary-hover)" : "hover:bg-(--sh-surface-hover)"
          )}
        >
          <Search className="size-4" />
        </button>
      </form>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Gợi ý tìm kiếm"
          className="absolute inset-x-0 top-full z-40 mt-2 rounded-[12px] border border-(--sh-border) bg-(--sh-elevated) p-4 shadow-xl"
        >
          {noResults ? (
            <div className="py-3 text-center">
              <p className="font-semibold">Không có kết quả cho “{term}”</p>
              <p className="mt-1 text-sm text-(--sh-muted)">Thử từ khoá khác, hoặc chọn một từ khoá phổ biến:</p>
              <PopularChips onPick={submit} className="mt-3 justify-center" />
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold">Tìm kiếm phổ biến</h2>
              <PopularChips onPick={submit} className="mt-2" />
              <h2 className="mt-4 text-sm font-semibold">{term ? "LUT phù hợp" : "LUT nổi bật"}</h2>
              <ul
                aria-busy={suggestions.isFetching}
                className={cn("mt-2 grid grid-cols-2 gap-3 transition-opacity", suggestions.isFetching && "opacity-60")}
              >
                {(items.length ? items : Array.from({ length: 4 }, () => null)).map((lut, i) => (
                  <li key={lut?.id ?? i}>
                    {lut ? (
                      <Link
                        to="/luts/$slug"
                        params={{ slug: lut.slug }}
                        onClick={() => setOpen(false)}
                        className="group block rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-(--sh-pink)/60"
                      >
                        <span className="relative block aspect-video overflow-hidden rounded-[8px] bg-(--sh-surface)">
                          <img
                            src={lut.coverUrl}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover transition-transform group-hover:scale-105"
                          />
                          {lut.premium && (
                            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-(--sh-pink)">
                              <Star className="size-2.5 fill-white text-white" aria-hidden />
                              <span className="sr-only">Premium</span>
                            </span>
                          )}
                        </span>
                        <span className="mt-1.5 block truncate text-sm font-semibold">{lut.title}</span>
                        <span className="block truncate text-xs text-(--sh-muted)">{lut.creator}</span>
                      </Link>
                    ) : (
                      <span aria-hidden className="block aspect-video animate-pulse rounded-[8px] bg-(--sh-surface)" />
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PopularChips({ onPick, className }: { onPick: (q: string) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {POPULAR_SEARCHES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="h-7 rounded-full bg-(--sh-surface) px-3 text-xs font-semibold transition-colors hover:bg-(--sh-surface-hover)"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
