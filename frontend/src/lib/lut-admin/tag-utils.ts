/**
 * Chuẩn hoá thẻ theo quy tắc §5.3 mục 5:
 * trim, gộp khoảng trắng liên tiếp thành một, chữ thường, giữ dấu.
 */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").toLowerCase();
}
