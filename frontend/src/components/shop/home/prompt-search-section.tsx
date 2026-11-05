import { useNavigate } from "@tanstack/react-router";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { SEARCH_PLACEHOLDERS, SEARCH_SUGGESTIONS } from "./home-data";

export function PromptSearchSection() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Hiệu ứng gõ placeholder
  const [placeholder, setPlaceholder] = useState(SEARCH_PLACEHOLDERS[0]);

  useEffect(() => {
    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReduced) {
      setPlaceholder(SEARCH_PLACEHOLDERS[0]);
      return;
    }

    if (focused || query !== "") return;

    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const currentPhrase = SEARCH_PLACEHOLDERS[phraseIdx];

      if (!isDeleting) {
        charIdx++;
        setPlaceholder(currentPhrase.slice(0, charIdx));

        if (charIdx === currentPhrase.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, 1500); // Dừng 1.5s
          return;
        }
        timeoutId = setTimeout(tick, 50); // Gõ 50ms/ký tự
      } else {
        charIdx--;
        setPlaceholder(currentPhrase.slice(0, charIdx));

        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % SEARCH_PLACEHOLDERS.length;
          timeoutId = setTimeout(tick, 300);
          return;
        }
        timeoutId = setTimeout(tick, 30); // Xoá nhanh 30ms/ký tự
      }
    };

    timeoutId = setTimeout(tick, 1500);
    return () => clearTimeout(timeoutId);
  }, [focused, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate({ to: "/luts", search: { q } });
  };

  const handleChip = (chip: string) => {
    setQuery(chip);
    inputRef.current?.focus();
  };

  return (
    <section
      aria-labelledby="search-title"
      className="px-4 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
        {/* Hộp tìm kiếm bên trái */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-(--sh-pink)/30 via-purple-500/20 to-blue-500/20 p-6 md:p-8">
          {/* Thẻ luôn trắng ở cả hai giao diện */}
          <div className="relative rounded-[16px] border border-white/60 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--sh-primary)">
              <Sparkles className="size-4" aria-hidden="true" />
              <span>Gợi ý màu thông minh</span>
            </div>

            <form
              role="search"
              aria-label="Tìm màu bằng lời"
              onSubmit={handleSubmit}
              className="mt-4"
            >
              <div className="flex items-center gap-2 rounded-[12px] border border-zinc-300 bg-white px-3 py-2 text-[#151a20] shadow-sm">
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="Mô tả video của bạn"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={placeholder}
                  className="w-full bg-transparent text-sm font-medium text-[#151a20] outline-none placeholder:text-zinc-400"
                />
                <ShopButton
                  type="submit"
                  variant="primary"
                  size="icon"
                  aria-label="Tìm LUT"
                  disabled={!query.trim()}
                  className="size-9 shrink-0 rounded-full"
                >
                  <Send className="size-4" />
                </ShopButton>
              </div>

              {/* 4 nút chip gợi ý */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">
                  Gợi ý:
                </span>
                {SEARCH_SUGGESTIONS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChip(chip)}
                    className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 transition-colors hover:border-(--sh-primary) hover:text-(--sh-primary) focus-visible:ring-2 focus-visible:ring-(--sh-pink)"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Cột chữ bên phải */}
        <div>
          <h2
            id="search-title"
            className="font-display text-2xl font-bold tracking-tight text-(--sh-fg) md:text-4xl"
          >
            <span className="block">Tìm màu,</span>
            <span className="block text-(--sh-accent)">bằng chính lời của bạn</span>
          </h2>
          <p className="mt-4 text-sm text-(--sh-muted) md:text-base">
            Mô tả cảnh quay hoặc cảm giác bạn muốn, DownBeat gợi ý ngay những LUT phù hợp.
          </p>
        </div>
      </div>
    </section>
  );
}
