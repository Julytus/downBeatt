import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { LutBrowser } from "@/components/shop/luts/lut-browser";
import { LutsDiscover } from "@/components/shop/luts/luts-discover";
import { LutsFaq } from "@/components/shop/luts/luts-faq";
import { LutsHero } from "@/components/shop/luts/luts-hero";
import { lutsSearchSchema, type LutsSearch } from "@/lib/search/luts";

export const Route = createFileRoute("/_shop/luts/")({
  validateSearch: lutsSearchSchema,
  component: LutsPage
});

function LutsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const onSearchChange = useCallback(
    (next: LutsSearch) => navigate({ search: next, replace: true, resetScroll: false }),
    [navigate]
  );

  useEffect(() => {
    document.title = "LUT miễn phí & preset chỉnh màu | DownBeat";
  }, []);

  return (
    <>
      <LutsHero q={search.q} onSearch={(q) => onSearchChange({ ...search, q: q || undefined })} />
      <hr className="mt-8 mb-8 border-(--sh-border)" />
      <LutBrowser search={search} onSearchChange={onSearchChange} />
      <LutsDiscover />
      <LutsFaq />
    </>
  );
}
