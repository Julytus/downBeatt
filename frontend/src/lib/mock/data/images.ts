/** Ảnh minh hoạ ngẫu nhiên theo seed (picsum). Dùng cho ảnh trang trí tĩnh (vd hero). */
export const picsum = (seed: string, w = 640, h = 360) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
