import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { HOME_FAQ, type FaqItem } from "./home-data";

function HomeFaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-b border-(--sh-border) last:border-b-0"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 px-1 py-5 text-left text-base font-semibold text-(--sh-fg) outline-none transition-colors hover:text-(--sh-primary) focus-visible:ring-2 focus-visible:ring-(--sh-pink) md:text-base"
        >
          <span>{item.q}</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-(--sh-muted) transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4.5 text-sm leading-relaxed text-(--sh-muted)">
        {item.a}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function HomeFaq() {
  return (
    <section
      aria-labelledby="faq-title"
      className="bg-(--sh-home-a) px-4 pt-16 pb-16 md:px-8 md:pt-32 md:pb-40"
    >
      <div className="mx-auto max-w-[1280px]">
        <h2
          id="faq-title"
          className="font-display text-3xl leading-[1.1] font-bold text-(--sh-fg) md:text-5xl"
        >
          Câu hỏi <br className="hidden md:block" />
          thường gặp
        </h2>

        {/* Danh sách 6 câu hỏi */}
        <div className="mx-auto mt-24 max-w-[792px] divide-y divide-(--sh-border)">
          {HOME_FAQ.map((item) => (
            <HomeFaqRow key={item.q} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
