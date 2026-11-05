/**
 * Bộ lọc SVG "mép mềm có hạt": alpha = hình đã làm mềm + nhiễu, màu lấy từ hình gốc nới rộng
 * (không lấy từ phần đã làm mềm để tránh viền tối ở mép). Dùng cho dải sóng ở khối "Kể câu chuyện".
 */
export function GrainFilter({ id, blur = 12, seed = 4 }: { id: string; blur?: number; seed?: number }) {
  return (
    <filter id={id} x="-15%" y="-25%" width="130%" height="150%" colorInterpolationFilters="sRGB">
      {/* Màu: nới hình gốc ra ~3σ để mép hạt luôn có màu đúng */}
      <feMorphology in="SourceGraphic" operator="dilate" radius={blur * 3} result="color" />
      <feGaussianBlur in="SourceAlpha" stdDeviation={blur} result="soft" />
      <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed={seed} stitchTiles="stitch" result="noise" />
      <feColorMatrix
        in="noise"
        type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0"
        result="noiseR"
      />
      {/* alpha = 1.2·mềm + 0.7·nhiễu − 0.45: trong lòng ≈ 1, ngoài ≈ 0, mép thành hạt */}
      <feComposite in="soft" in2="noiseR" operator="arithmetic" k2="1.2" k3="0.7" k4="-0.45" result="mask" />
      <feColorMatrix
        in="noise"
        type="matrix"
        values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1"
        result="gray"
      />
      {/* Hạt mịn trong lòng hình */}
      <feComposite in="color" in2="gray" operator="arithmetic" k2="1" k3="0.18" k4="-0.09" result="grained" />
      <feComposite in="grained" in2="mask" operator="in" />
    </filter>
  );
}
