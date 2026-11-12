package vn.aeoc.business.recommend.eval.sim;

import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.lut.LutColorFeature;

import java.time.LocalDateTime;
import java.util.*;

public class CatalogGenerator {

    public static final List<String> STYLES = List.of(
            "am-ap", "lanh", "phim-nhua", "dien-anh", "teal-orange", "du-lich", "co-dien", "den-trang"
    );

    public static final List<String> VOCABULARY = List.of(
            "ấm", "lạnh", "rực rỡ", "phai màu", "tương phản", "mềm", "sáng", "tối", "đen trắng", "teal",
            "hoàng hôn", "xanh", "phim", "grain", "điện ảnh", "phong cảnh", "tươi", "vintage",
            "vàng", "mùa thu", "trầm", "đêm", "kodak", "fuji", "cam", "biển", "rừng", "cũ", "hoài niệm",
            "chân dung", "cổ điển"
    );

    private static final Map<String, List<String>> FALLBACK_TAGS = Map.of(
            "am-ap", List.of("vàng", "mùa thu"),
            "lanh", List.of("trầm", "đêm"),
            "phim-nhua", List.of("kodak", "fuji"),
            "dien-anh", List.of("trầm", "đêm"),
            "teal-orange", List.of("cam", "biển"),
            "du-lich", List.of("biển", "rừng"),
            "co-dien", List.of("cũ", "hoài niệm"),
            "den-trang", List.of("chân dung", "cổ điển")
    );

    private static final Map<String, String> RARE_SYNONYMS = Map.of(
            "ấm", "cam",
            "lạnh", "lam",
            "rực rỡ", "chói",
            "phai màu", "bạc màu",
            "tương phản", "gắt",
            "đen trắng", "đơn sắc"
    );

    private static final Map<String, List<String>> STYLE_NOUNS = Map.of(
            "am-ap", List.of("Hoàng Hôn", "Nắng Chiều", "Mùa Thu", "Phố Cổ"),
            "lanh", List.of("Băng Giá", "Mùa Đông", "Đêm Lạnh", "Sương Mù"),
            "phim-nhua", List.of("Cuộn Phim", "Kỷ Niệm", "Thước Phim", "Màu Thời Gian"),
            "dien-anh", List.of("Điện Ảnh", "Màn Bạc", "Khung Hình", "Góc Quay"),
            "teal-orange", List.of("Biển Xanh", "Nắng Vàng", "Đường Chân Trời", "Bình Minh"),
            "du-lich", List.of("Hành Trình", "Khám Phá", "Đồng Cỏ", "Chuyến Đi"),
            "co-dien", List.of("Cổ Điển", "Hoài Niệm", "Quá Khứ", "Dấu Thời Gian"),
            "den-trang", List.of("Đơn Sắc", "Tương Phản", "Đen Trắng", "Tối Giản")
    );

    private static final Map<String, String> STYLE_NAMES = Map.of(
            "am-ap", "Ấm áp",
            "lanh", "Lạnh",
            "phim-nhua", "Phim nhựa",
            "dien-anh", "Điện ảnh",
            "teal-orange", "Teal & Orange",
            "du-lich", "Du lịch",
            "co-dien", "Cổ điển",
            "den-trang", "Đen trắng"
    );

    private static final Map<String, String> OCCASION_NAMES = Map.of(
            "ban-dem", "ban đêm",
            "du-lich", "du lịch",
            "dam-cuoi", "đám cưới",
            "chan-dung", "chân dung"
    );

    private record Prototype(
            double br, double k, double s, double t, double m,
            double hueS, double strS, double hueH, double strH, boolean mono
    ) {}

    private static final Map<String, Prototype> PROTOTYPES = Map.of(
            "am-ap", new Prototype(0.02, 1.05, 1.10, 0.8, 0.1, 30.0, 0.05, 35.0, 0.10, false),
            "lanh", new Prototype(-0.02, 1.05, 0.95, -0.8, -0.1, 210.0, 0.08, 200.0, 0.05, false),
            "phim-nhua", new Prototype(0.03, 0.88, 0.85, 0.2, 0.1, 180.0, 0.06, 40.0, 0.06, false),
            "dien-anh", new Prototype(-0.04, 1.20, 0.95, 0.0, 0.0, 200.0, 0.10, 30.0, 0.08, false),
            "teal-orange", new Prototype(0.00, 1.15, 1.20, 0.1, 0.0, 185.0, 0.16, 28.0, 0.16, false),
            "du-lich", new Prototype(0.04, 1.10, 1.35, 0.2, 0.0, 190.0, 0.04, 45.0, 0.04, false),
            "co-dien", new Prototype(0.02, 0.85, 0.70, 0.5, 0.15, 35.0, 0.08, 45.0, 0.08, false),
            "den-trang", new Prototype(0.00, 1.15, 1.00, 0.0, 0.0, 35.0, 0.00, 35.0, 0.00, true)
    );

    public static List<Lut> generate(int n, SplittableRandom rng) {
        List<Lut> list = new ArrayList<>(n);
        LocalDateTime baseTime = LocalDateTime.of(2026, 1, 1, 0, 0, 0);
        long totalSeconds = 120L * 24 * 3600;

        for (int i = 1; i <= n; i++) {
            int styleIdx = (i - 1) % 8;
            String style = STYLES.get(styleIdx);
            Prototype proto = PROTOTYPES.get(style);

            double br = proto.br;
            double k = proto.k;
            double s = proto.s;
            double t = proto.t;
            double m = proto.m;
            double hueS = proto.hueS;
            double strS = proto.strS;
            double hueH = proto.hueH;
            double strH = proto.strH;
            boolean mono = proto.mono;

            if (mono && style.equals("den-trang")) {
                if (rng.nextDouble() < 0.30) {
                    strS = 0.03;
                    strH = 0.03;
                }
            }

            // 10% LUTs: "LUT giữa hai phong cách"
            if (rng.nextDouble() < 0.10) {
                int otherIdx = rng.nextInt(7);
                if (otherIdx >= styleIdx) otherIdx++;
                String otherStyle = STYLES.get(otherIdx);
                Prototype otherProto = PROTOTYPES.get(otherStyle);

                double w = 0.3 + rng.nextDouble() * 0.2; // [0.3, 0.5)
                br = (1.0 - w) * br + w * otherProto.br;
                k = (1.0 - w) * k + w * otherProto.k;
                s = (1.0 - w) * s + w * otherProto.s;
                t = (1.0 - w) * t + w * otherProto.t;
                m = (1.0 - w) * m + w * otherProto.m;
                double otherStrS = otherProto.strS;
                double otherStrH = otherProto.strH;
                strS = (1.0 - w) * strS + w * otherStrS;
                strH = (1.0 - w) * strH + w * otherStrH;
                // style, hue, mono theo phong cách chính
            }

            // Nhiễu chuẩn Gaussian
            br += 0.02 * nextGaussian(rng);
            k += 0.06 * nextGaussian(rng);
            s += 0.10 * nextGaussian(rng);
            t += 0.25 * nextGaussian(rng);
            m += 0.08 * nextGaussian(rng);
            hueS += 15.0 * nextGaussian(rng);
            hueH += 15.0 * nextGaussian(rng);
            strS += 0.03 * nextGaussian(rng);
            strH += 0.03 * nextGaussian(rng);

            // Kẹp
            s = Math.max(0.3, s);
            k = Math.max(0.5, k);
            strS = Math.max(0.0, strS);
            strH = Math.max(0.0, strH);

            CubeWriter.ColorParams colorParams = new CubeWriter.ColorParams(
                    br, k, s, t, m, hueS, strS, hueH, strH, mono
            );
            LutColorFeature colorFeature = CubeWriter.extract(colorParams);

            // Thẻ theo luật
            LinkedHashSet<String> tagSet = new LinkedHashSet<>();
            if (t >= 0.4) tagSet.add("ấm");
            if (t <= -0.4) tagSet.add("lạnh");
            if (s >= 1.25) tagSet.add("rực rỡ");
            if (s <= 0.8 && !mono) tagSet.add("phai màu");
            if (k >= 1.15) tagSet.add("tương phản");
            if (k <= 0.9) tagSet.add("mềm");
            if (br >= 0.03) tagSet.add("sáng");
            if (br <= -0.03) tagSet.add("tối");
            if (mono) tagSet.add("đen trắng");

            double normHueS = normalizeHue(hueS);
            double normHueH = normalizeHue(hueH);
            if (normHueS >= 170.0 && normHueS <= 220.0 && normHueH >= 15.0 && normHueH <= 50.0 && strS >= 0.1 && strH >= 0.1) {
                tagSet.add("teal");
            }

            // Thẻ phong cách
            switch (style) {
                case "am-ap" -> tagSet.add("hoàng hôn");
                case "lanh" -> tagSet.add("xanh");
                case "phim-nhua" -> {
                    tagSet.add("phim");
                    tagSet.add("grain");
                }
                case "dien-anh" -> tagSet.add("điện ảnh");
                case "teal-orange" -> {
                    tagSet.add("teal");
                    tagSet.add("điện ảnh");
                }
                case "du-lich" -> {
                    tagSet.add("phong cảnh");
                    tagSet.add("tươi");
                }
                case "co-dien" -> tagSet.add("vintage");
                case "den-trang" -> tagSet.add("đen trắng");
            }

            // Chưa đủ 3 thẻ thì thêm từ danh sách bổ sung
            List<String> fallbacks = FALLBACK_TAGS.getOrDefault(style, List.of());
            for (String fb : fallbacks) {
                if (tagSet.size() >= 3) break;
                tagSet.add(fb);
            }

            // Nhiễu thẻ
            List<String> rawTagList = new ArrayList<>(tagSet);
            List<String> noisyTags = new ArrayList<>();
            for (String tag : rawTagList) {
                if (rng.nextDouble() < 0.10) {
                    noisyTags.add(VOCABULARY.get(rng.nextInt(VOCABULARY.size())));
                } else {
                    noisyTags.add(tag);
                }
            }

            // 15% LUT đổi sang đồng nghĩa ít gặp
            if (rng.nextDouble() < 0.15) {
                for (int ti = 0; ti < noisyTags.size(); ti++) {
                    String tag = noisyTags.get(ti);
                    if (RARE_SYNONYMS.containsKey(tag)) {
                        noisyTags.set(ti, RARE_SYNONYMS.get(tag));
                    }
                }
            }

            LinkedHashSet<String> finalTagSet = new LinkedHashSet<>(noisyTags);
            for (String fb : fallbacks) {
                if (finalTagSet.size() >= 3) break;
                finalTagSet.add(fb);
            }
            int vocabIdx = 0;
            while (finalTagSet.size() < 3 && vocabIdx < VOCABULARY.size()) {
                finalTagSet.add(VOCABULARY.get(vocabIdx++));
            }

            List<String> tags = new ArrayList<>();
            for (String tag : finalTagSet) {
                tags.add(tag);
                if (tags.size() >= 6) break;
            }

            // Danh mục
            LinkedHashSet<String> catSet = new LinkedHashSet<>();
            catSet.add(style);
            if (t >= 0.4) catSet.add("am-ap");
            if (t <= -0.4) catSet.add("lanh");
            if (s >= 1.25) catSet.add("ruc-ro");
            if (tags.contains("teal")) catSet.add("teal-orange");

            String occasion = null;
            if (rng.nextDouble() < 0.50) {
                if (br <= -0.03) {
                    occasion = "ban-dem";
                } else {
                    String[] occOptions = {"du-lich", "dam-cuoi", "chan-dung"};
                    occasion = occOptions[rng.nextInt(3)];
                }
                catSet.add(occasion);
            }
            catSet.add("premiere-pro");
            catSet.add("davinci-resolve");
            catSet.add("final-cut-pro");
            catSet.add("capcut");
            List<String> categories = new ArrayList<>(catSet);

            // Tác giả
            List<Integer> specialists = new ArrayList<>();
            for (int c = 1; c <= 12; c++) {
                if (style.equals(STYLES.get(c % 8)) || style.equals(STYLES.get((c + 3) % 8))) {
                    specialists.add(c);
                }
            }
            int creatorId;
            if (rng.nextDouble() < 0.80 && !specialists.isEmpty()) {
                creatorId = specialists.get(rng.nextInt(specialists.size()));
            } else {
                creatorId = 1 + rng.nextInt(12);
            }

            // Tiêu đề / Mô tả
            List<String> nouns = STYLE_NOUNS.getOrDefault(style, List.of("Tác Phẩm", "Góc Nhìn", "Khung Hình", "Màu Sắc"));
            String noun = nouns.get(rng.nextInt(nouns.size()));
            String firstTag = tags.get(0);
            String capTag = capitalizeFirst(firstTag);
            String title = noun + " " + capTag + " " + String.format("%03d", i);

            String styleName = STYLE_NAMES.getOrDefault(style, style);
            String occName = (occasion != null && OCCASION_NAMES.containsKey(occasion))
                    ? OCCASION_NAMES.get(occasion)
                    : "video hằng ngày";
            String tag1 = tags.get(0);
            String tag2 = tags.size() > 1 ? tags.get(1) : tags.get(0);
            String description = String.format("LUT %s %s, %s, hợp quay %s.", styleName, tag1, tag2, occName);

            // isPremium
            int isPremium = rng.nextDouble() < 0.30 ? 1 : 0;

            // publishedTime
            long sec = (long) (rng.nextDouble() * totalSeconds);
            LocalDateTime publishedTime = baseTime.plusSeconds(sec);

            Lut lut = new Lut();
            lut.setId(i);
            lut.setSlug(String.format("eval-%03d", i));
            lut.setTitle(title);
            lut.setDescription(description);
            lut.setCreatorId(creatorId);
            lut.setStyle(style);
            lut.setIsPremium(isPremium);
            lut.setStatus("PUBLISHED");
            lut.setDownloadCount(0);
            lut.setPublishedTime(publishedTime);
            lut.setCategories(categories);
            lut.setTags(tags);
            colorFeature.setLutId(i);
            lut.setColorFeature(colorFeature);

            list.add(lut);
        }

        return list;
    }

    public static double nextGaussian(SplittableRandom rng) {
        double u1 = rng.nextDouble();
        while (u1 <= 1e-15) {
            u1 = rng.nextDouble();
        }
        double u2 = rng.nextDouble();
        return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    }

    private static double normalizeHue(double h) {
        double nh = h % 360.0;
        if (nh < 0) nh += 360.0;
        return nh;
    }

    private static String capitalizeFirst(String s) {
        if (s == null || s.isEmpty()) return "";
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
