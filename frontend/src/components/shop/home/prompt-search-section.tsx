import { useNavigate } from "@tanstack/react-router";
import { Send } from "lucide-react";
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
      className="bg-(--sh-home-b) px-4 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[654px_1fr] lg:items-center lg:gap-20">
        {/* Hộp tìm kiếm bên trái: thẻ trắng 654×367, hai dải sóng loang tím / chàm, ô nhập tràn mép phải */}
        <div className="relative isolate aspect-[654/367] w-full max-w-[654px] overflow-hidden rounded-[12px] bg-white">
          <svg
            aria-hidden="true"
            className="absolute inset-0 -z-10 size-full"
            viewBox="0 0 654 367"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="prompt-top" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d58cf0" />
                <stop offset="50%" stopColor="#c46cf0" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="prompt-bottom" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6d3df0" />
                <stop offset="50%" stopColor="#4338e8" />
                <stop offset="100%" stopColor="#5b46f0" />
              </linearGradient>
              <filter id="prompt-blur" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
            </defs>
            <path
              filter="url(#prompt-blur)"
              fill="url(#prompt-top)"
              d="M-40,150 C40,70 110,40 190,70 C270,100 330,40 420,50 C510,60 560,30 700,60 L700,190 L-40,190 Z"
            />
            <path
              filter="url(#prompt-blur)"
              fill="url(#prompt-bottom)"
              d="M-40,250 L700,250 L700,300 C620,290 560,330 470,300 C390,275 330,340 240,315 C150,290 90,340 -40,320 Z"
            />
          </svg>

          <div className="absolute top-[32%] right-0 left-[10%] rounded-l-[10px] bg-white p-4 shadow-[0_10px_30px_rgba(60,20,120,0.18)]">
            <span className="sr-only">Gợi ý màu thông minh</span>

            <form
              role="search"
              aria-label="Tìm màu bằng lời"
              onSubmit={handleSubmit}
            >
              <div className="flex items-center gap-2 text-[#151a20]">
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="Mô tả video của bạn"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={placeholder}
                  className="h-10 w-full bg-transparent text-lg text-[#151a20] outline-none placeholder:text-[#151a20] md:text-xl"
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
              <div className="mt-5 flex flex-nowrap items-center gap-2 overflow-hidden">
                <span className="sr-only">Gợi ý:</span>
                {SEARCH_SUGGESTIONS.map((chip, i) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChip(chip)}
                    className={`shrink-0 rounded-[6px] border bg-white px-3.5 py-2 text-sm font-medium text-zinc-800 transition-colors ${i === 0 ? "border-zinc-800" : "border-zinc-300"} hover:border-(--sh-primary) hover:text-(--sh-primary) focus-visible:ring-2 focus-visible:ring-(--sh-pink)`}
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
            className="font-display text-3xl leading-[1.1] font-bold text-(--sh-fg) md:text-5xl"
          >
            <span className="block">Tìm màu,</span>
            <span className="block">bằng chính lời của bạn</span>
          </h2>
          <p className="mt-5 max-w-[360px] text-base leading-7 text-(--sh-fg) md:text-lg">
            Mô tả cảnh quay hoặc cảm giác bạn muốn, DownBeat gợi ý ngay những LUT phù hợp.
          </p>
        </div>
      </div>
    </section>
  );
}
