/**
 * Chuẩn hoá số điện thoại theo quy tắc §5.4:
 * trim; bỏ dấu cách, dấu chấm, dấu gạch nối;
 * nếu bắt đầu bằng `+84` hoặc `84` thì đổi thành `0`.
 */
export function normalizePhone(phone: string): string {
  let p = phone.trim().replace(/[\s.-]/g, "");
  if (p.startsWith("+84")) {
    p = "0" + p.slice(3);
  } else if (p.startsWith("84")) {
    p = "0" + p.slice(2);
  }
  return p;
}

/**
 * Kiểm tra định dạng số điện thoại di động Việt Nam:
 * 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09 (`^0(3|5|7|8|9)\d{8}$`).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  return /^0(3|5|7|8|9)\d{8}$/.test(normalized);
}
