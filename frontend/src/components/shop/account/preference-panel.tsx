import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLuts } from "@/lib/axios/luts";
import { preferenceQueryOptions, savePreferenceMutationOptions } from "@/lib/tanstack/options/account";
import {
  LUT_STYLE_LABEL,
  LUT_STYLES,
  type LutDTO,
  type LutListResponseDTO,
  type LutStyle
} from "@/lib/types/lut";
import {
  PREFERENCE_MAX_STYLES,
  PREFERENCE_SHOOT_OPTIONS,
  PREFERENCE_SOFTWARE_OPTIONS
} from "@/lib/types/recommend";
import { cn } from "@/lib/utils";

interface PreferencePanelProps {
  mode: "onboarding" | "edit";
  next?: { then: "download" | "collection"; lut: LutDTO };
  onDone: (saved: boolean) => void;
}

/** Hook nạp ảnh mẫu cho 8 phong cách màu (plan §6.2). */
export function usePreferenceStyleImages() {
  return useQueries({
    queries: LUT_STYLES.map((slug) => ({
      queryKey: ["lut-style-sample", slug],
      queryFn: () => getLuts({ styles: [slug], sort: "popular", paging: { page: 1, limit: 1 } }),
      staleTime: 10 * 60 * 1000,
      select: (res: LutListResponseDTO) => {
        const item = res.items[0];
        return item?.afterUrl || item?.coverUrl || null;
      }
    }))
  });
}

/**
 * Nội dung chọn sở thích màu (plan §6.2, §6.3).
 * Dùng ở bước 2 sau đăng ký (onboarding) và ở menu "Sở thích màu" (edit).
 */
export function PreferencePanel({ mode, next, onDone }: PreferencePanelProps) {
  const [selectedStyles, setSelectedStyles] = useState<LutStyle[]>([]);
  const [selectedShoots, setSelectedShoots] = useState<string[]>([]);
  const [selectedSoftwares, setSelectedSoftwares] = useState<string[]>([]);
  const [exceededWarning, setExceededWarning] = useState(false);

  const styleImageQueries = usePreferenceStyleImages();

  const {
    data: prefData,
    isLoading: isPrefLoading,
    isError: isPrefError,
    refetch: refetchPref
  } = useQuery({
    ...preferenceQueryOptions,
    enabled: mode === "edit"
  });

  useEffect(() => {
    if (mode === "edit" && prefData?.categorySlugs) {
      const slugs = prefData.categorySlugs;
      setSelectedStyles(LUT_STYLES.filter((s) => slugs.includes(s)));
      setSelectedShoots(PREFERENCE_SHOOT_OPTIONS.map((o) => o.slug).filter((s) => slugs.includes(s)));
      setSelectedSoftwares(PREFERENCE_SOFTWARE_OPTIONS.map((o) => o.slug).filter((s) => slugs.includes(s)));
    }
  }, [mode, prefData]);

  const saveMutation = useMutation(savePreferenceMutationOptions);

  const handleToggleStyle = (slug: LutStyle) => {
    if (selectedStyles.includes(slug)) {
      setSelectedStyles((prev) => prev.filter((s) => s !== slug));
      setExceededWarning(false);
    } else {
      if (selectedStyles.length < PREFERENCE_MAX_STYLES) {
        setSelectedStyles((prev) => [...prev, slug]);
        setExceededWarning(false);
      } else {
        setExceededWarning(true);
      }
    }
  };

  const handleToggleShoot = (slug: string) => {
    setSelectedShoots((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleToggleSoftware = (slug: string) => {
    setSelectedSoftwares((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSave = () => {
    const orderedStyles = LUT_STYLES.filter((s) => selectedStyles.includes(s));
    const orderedShoots = PREFERENCE_SHOOT_OPTIONS.map((o) => o.slug).filter((s) =>
      selectedShoots.includes(s)
    );
    const orderedSoftwares = PREFERENCE_SOFTWARE_OPTIONS.map((o) => o.slug).filter((s) =>
      selectedSoftwares.includes(s)
    );
    const categorySlugs = [...orderedStyles, ...orderedShoots, ...orderedSoftwares];

    saveMutation.mutate(categorySlugs, {
      onSuccess: () => {
        onDone(true);
      }
    });
  };

  if (mode === "edit" && isPrefLoading) {
    return (
      <div className="space-y-6 py-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LUT_STYLES.map((slug) => (
              <div key={slug} className="space-y-2">
                <Skeleton className="aspect-4/3 w-full rounded-[8px]" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
        <div className="sticky -bottom-6 -mx-6 mt-6 flex items-center justify-end gap-3 border-t border-(--sh-border) bg-(--sh-elevated) px-6 py-4 sm:-bottom-8 sm:-mx-8 sm:px-8">
          <ShopButton variant="ghost" onClick={() => onDone(false)}>
            Huỷ
          </ShopButton>
          <ShopButton variant="primary" disabled>
            Lưu sở thích
          </ShopButton>
        </div>
      </div>
    );
  }

  if (mode === "edit" && isPrefError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <p className="text-sm text-(--sh-muted)">Không tải được sở thích màu</p>
        <ShopButton variant="secondary" size="sm" onClick={() => void refetchPref()}>
          Thử lại
        </ShopButton>
        <div className="sticky -bottom-6 -mx-6 mt-6 flex w-full items-center justify-end gap-3 border-t border-(--sh-border) bg-(--sh-elevated) px-6 py-4 sm:-bottom-8 sm:-mx-8 sm:px-8">
          <ShopButton variant="ghost" onClick={() => onDone(false)}>
            Huỷ
          </ShopButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-1">
      {/* Nhóm 1: Phong cách màu */}
      <fieldset className="space-y-3">
        <legend className="sr-only">Phong cách màu</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LUT_STYLES.map((slug, idx) => {
            const name = LUT_STYLE_LABEL[slug];
            const checked = selectedStyles.includes(slug);
            const query = styleImageQueries[idx];

            return (
              <label
                key={slug}
                className={cn(
                  "group relative flex cursor-pointer flex-col overflow-hidden rounded-[8px] border text-left select-none transition-all",
                  checked
                    ? "border-(--sh-pink) ring-1 ring-(--sh-pink)"
                    : "border-(--sh-border) bg-(--sh-surface) hover:border-(--sh-muted)"
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  aria-label={name}
                  checked={checked}
                  onChange={() => handleToggleStyle(slug)}
                />
                <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  {query?.isLoading ? (
                    <Skeleton className="size-full rounded-none" />
                  ) : query?.data ? (
                    <img src={query.data} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-gradient-to-br from-neutral-200/40 to-neutral-300/40 dark:from-neutral-800/40 dark:to-neutral-700/40" />
                  )}
                  {checked && (
                    <div
                      aria-hidden="true"
                      className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-(--sh-pink) text-white shadow-xs"
                    >
                      <Check className="size-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <span
                    className={cn(
                      "block truncate text-xs font-medium",
                      checked ? "font-semibold text-(--sh-pink)" : "text-(--sh-fg)"
                    )}
                  >
                    {name}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        <div
          aria-live="polite"
          className={cn(
            "text-xs transition-colors",
            exceededWarning ? "font-semibold text-amber-500" : "text-(--sh-muted)"
          )}
        >
          {exceededWarning
            ? "Tối đa 5 phong cách"
            : `Đã chọn ${selectedStyles.length} / 5 phong cách`}
        </div>
      </fieldset>

      {/* Nhóm 2: Dịp quay */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-(--sh-fg)">
          Bạn hay quay gì? <span className="text-xs font-normal text-(--sh-muted)">Không bắt buộc</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {PREFERENCE_SHOOT_OPTIONS.map((opt) => {
            const checked = selectedShoots.includes(opt.slug);
            return (
              <label
                key={opt.slug}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium select-none transition-colors",
                  checked
                    ? "border-(--sh-pink) bg-(--sh-pink)/10 text-(--sh-pink)"
                    : "border-(--sh-border) bg-(--sh-surface) text-(--sh-muted) hover:text-(--sh-fg)"
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  aria-label={opt.label}
                  checked={checked}
                  onChange={() => handleToggleShoot(opt.slug)}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Nhóm 3: Phần mềm dựng phim */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-(--sh-fg)">
          Bạn dựng phim bằng phần mềm nào?{" "}
          <span className="text-xs font-normal text-(--sh-muted)">Không bắt buộc</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {PREFERENCE_SOFTWARE_OPTIONS.map((opt) => {
            const checked = selectedSoftwares.includes(opt.slug);
            return (
              <label
                key={opt.slug}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium select-none transition-colors",
                  checked
                    ? "border-(--sh-pink) bg-(--sh-pink)/10 text-(--sh-pink)"
                    : "border-(--sh-border) bg-(--sh-surface) text-(--sh-muted) hover:text-(--sh-fg)"
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  aria-label={opt.label}
                  checked={checked}
                  onChange={() => handleToggleSoftware(opt.slug)}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Chân hộp thoại dính đáy (plan §6.2, §6.3, §6.5) */}
      <div className="sticky -bottom-6 -mx-6 mt-6 flex items-center justify-end gap-3 border-t border-(--sh-border) bg-(--sh-elevated) px-6 py-4 z-10 sm:-bottom-8 sm:-mx-8 sm:px-8">
        {mode === "onboarding" ? (
          <>
            <ShopButton
              type="button"
              variant="ghost"
              disabled={saveMutation.isPending}
              onClick={() => onDone(false)}
            >
              Bỏ qua
            </ShopButton>
            <ShopButton
              type="button"
              variant="primary"
              disabled={selectedStyles.length === 0 || saveMutation.isPending}
              onClick={handleSave}
            >
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {!next
                ? "Xem gợi ý cho tôi"
                : next.then === "download"
                  ? "Lưu và tải LUT"
                  : "Lưu và tiếp tục"}
            </ShopButton>
          </>
        ) : (
          <>
            <ShopButton
              type="button"
              variant="ghost"
              disabled={saveMutation.isPending}
              onClick={() => onDone(false)}
            >
              Huỷ
            </ShopButton>
            <ShopButton
              type="button"
              variant="primary"
              disabled={selectedStyles.length === 0 || saveMutation.isPending}
              onClick={handleSave}
            >
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Lưu sở thích
            </ShopButton>
          </>
        )}
      </div>
    </div>
  );
}
