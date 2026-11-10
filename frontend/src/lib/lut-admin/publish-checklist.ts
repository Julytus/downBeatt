import type { LutCategoryDTO } from "@/lib/types/lut";
import type { LutAdminDetailDTO } from "@/lib/types/lut-admin";

export interface PublishChecklistItem {
  label: string;
  ok: boolean;
}

const FALLBACK_SOFTWARE_SLUGS = new Set([
  "premiere-pro",
  "davinci-resolve",
  "final-cut-pro",
  "capcut"
]);

/**
 * Tính 5 điều kiện xuất bản theo dữ liệu đã lưu của LUT (§6.2).
 * Nhóm "phan-mem" không tính cho điều kiện danh mục.
 */
export function publishChecklist(
  detail: LutAdminDetailDTO | null | undefined,
  categories: LutCategoryDTO[] = []
): PublishChecklistItem[] {
  if (!detail) {
    return [
      { label: "Có ảnh bìa", ok: false },
      { label: "Có ảnh trước và ảnh sau", ok: false },
      { label: "Có file .cube đã đo đặc trưng màu", ok: false },
      { label: "Có ít nhất 3 thẻ", ok: false },
      { label: "Có ít nhất 1 danh mục ngoài nhóm Phần mềm", ok: false }
    ];
  }

  const isVideo = detail.previewType === "VIDEO";
  const previewLabel = isVideo ? "Có video xem trước" : "Có ảnh trước và ảnh sau";
  const previewOk = isVideo
    ? Boolean(detail.previewVideoUrl)
    : Boolean(detail.beforeUrl && detail.afterUrl);

  const softwareSlugs =
    categories.length > 0
      ? new Set(categories.filter((c) => c.group === "phan-mem").map((c) => c.slug))
      : FALLBACK_SOFTWARE_SLUGS;

  const hasNonSoftwareCategory = (detail.categories ?? []).some(
    (slug) => !softwareSlugs.has(slug)
  );

  return [
    {
      label: "Có ảnh bìa",
      ok: Boolean(detail.coverUrl)
    },
    {
      label: previewLabel,
      ok: previewOk
    },
    {
      label: "Có file .cube đã đo đặc trưng màu",
      ok: Boolean(detail.colorFeature && (detail.fileSizeKb || detail.lutSize))
    },
    {
      label: "Có ít nhất 3 thẻ",
      ok: (detail.tags?.length ?? 0) >= 3
    },
    {
      label: "Có ít nhất 1 danh mục ngoài nhóm Phần mềm",
      ok: hasNonSoftwareCategory
    }
  ];
}
