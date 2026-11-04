const VND = new Intl.NumberFormat("vi-VN");

/** 99000 → "99.000đ" */
export const formatVnd = (amount: number) => `${VND.format(amount)}đ`;

/** 18840 → "18,8 N" (số lượt tải gọn) */
export const formatCompact = (n: number) =>
  new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
