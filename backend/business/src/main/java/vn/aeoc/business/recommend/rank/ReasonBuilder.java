package vn.aeoc.business.recommend.rank;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.business.recommend.profile.UserProfile;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.util.*;
import java.util.function.Function;

public class ReasonBuilder {

    private final Function<Integer, ItemVector> itemOf;
    private final Function<Integer, String> titleOf;
    private final Map<String, String> categoryNames;
    private final RecommendProperties props;

    public ReasonBuilder(Function<Integer, ItemVector> itemOf,
                         Function<Integer, String> titleOf,
                         Map<String, String> categoryNames,
                         RecommendProperties props) {
        this.itemOf = itemOf;
        this.titleOf = titleOf;
        this.categoryNames = categoryNames != null ? categoryNames : Collections.emptyMap();
        this.props = props != null ? props : new RecommendProperties();
    }

    public String reason(UserProfile profile,
                         ItemVector item,
                         Map<String, Double> contributions,
                         String creatorName,
                         int recentDownloads) {
        if (item == null) {
            return "Có thể hợp gu của bạn";
        }

        // 1 & 2. POPULAR
        if (profile == null || "POPULAR".equalsIgnoreCase(profile.strategy())) {
            if (recentDownloads > 0 || item.downloadCount() > 0) {
                return "Đang được tải nhiều";
            } else {
                return "Mới thêm vào kho";
            }
        }

        Map<Integer, PositiveAnchor> positiveHistory = extractPositiveHistory(profile);

        // 3, 4, 5. Chính LUT này có trong lịch sử dương
        PositiveAnchor selfHistory = positiveHistory.get(item.id());
        if (selfHistory != null) {
            String type = selfHistory.strongestType();
            if ("PURCHASE".equalsIgnoreCase(type)) {
                return "Bạn đã chọn LUT này khi mua gói";
            } else if ("FAVORITE".equalsIgnoreCase(type)) {
                return "Có trong bộ sưu tập của bạn";
            } else if ("VIEW".equalsIgnoreCase(type) || "PREVIEW".equalsIgnoreCase(type)) {
                return "Bạn đã xem LUT này";
            }
        }

        // 6. strategy PREFERENCE
        if ("PREFERENCE".equalsIgnoreCase(profile.strategy())) {
            return buildDeclaredReason(profile, item);
        }

        // 7 -> 11: Tìm b*
        String bStar = findBStar(contributions);

        if (bStar != null) {
            if ("style".equals(bStar)) {
                String s = item.style();
                double alpha = profile.alpha();
                double declaredVal = (s != null && profile.declared() != null)
                        ? alpha * profile.declared().style().getOrDefault(s, 0.0)
                        : 0.0;
                double behaviorVal = (s != null && profile.behavior() != null)
                        ? (1.0 - alpha) * profile.behavior().style().getOrDefault(s, 0.0)
                        : 0.0;

                // Dòng 7
                if (declaredVal >= behaviorVal && declaredVal > 0) {
                    return "Vì bạn thích phong cách " + styleName(s);
                }

                // Dòng 8 & 8b
                PositiveAnchor anchor = findBestStyleAnchor(positiveHistory, item, s);
                if (anchor != null) {
                    String aTitle = titleOf != null ? titleOf.apply(anchor.id()) : null;
                    if (aTitle == null || aTitle.isBlank()) {
                        aTitle = "LUT";
                    }
                    return "Cùng phong cách " + styleName(s) + " với " + aTitle + " bạn " + anchor.verb();
                } else {
                    return "Vì bạn hay lọc phong cách " + styleName(s);
                }
            } else if ("color".equals(bStar)) {
                // Dòng 9
                PositiveAnchor anchor = findBestColorAnchor(positiveHistory, item);
                if (anchor != null) {
                    String aTitle = titleOf != null ? titleOf.apply(anchor.id()) : null;
                    if (aTitle == null || aTitle.isBlank()) {
                        aTitle = "LUT";
                    }
                    return "Tông màu giống " + aTitle + " bạn " + anchor.verb();
                }
                // Nếu không có anchor, chuyển xuống dòng 15
            } else if ("tag".equals(bStar)) {
                // Dòng 10
                String bestTag = findBestTag(profile, item);
                if (bestTag != null) {
                    return "Có “" + bestTag + "” như các LUT bạn hay xem";
                }
            } else if ("category".equals(bStar)) {
                // Dòng 10b
                String bestCategory = findBestCategory(profile, item);
                if (bestCategory != null) {
                    return "Thuộc danh mục " + categoryName(bestCategory) + " bạn quan tâm";
                }
            } else if ("creator".equals(bStar)) {
                // Dòng 11
                String name = creatorName;
                if (name == null || name.isBlank()) {
                    name = item.creatorId() != null ? String.valueOf(item.creatorId()) : "";
                }
                if (!name.isBlank()) {
                    return "Cùng tác giả " + name.trim();
                }
            }
        }

        // 15. Fallback
        if (hasDeclared(profile)) {
            return buildDeclaredReason(profile, item);
        }
        return "Có thể hợp gu của bạn";
    }

    private boolean hasDeclared(UserProfile profile) {
        if (profile == null) return false;
        if (profile.preferenceSlugs() != null && !profile.preferenceSlugs().isEmpty()) {
            return true;
        }
        if (profile.declared() != null) {
            return !profile.declared().style().isEmpty() || !profile.declared().category().isEmpty();
        }
        return false;
    }

    private String buildDeclaredReason(UserProfile profile, ItemVector item) {
        // Dòng 12
        String s = item.style();
        if (s != null && profile.declared() != null && profile.declared().style().getOrDefault(s, 0.0) > 0) {
            return "Vì bạn thích phong cách " + styleName(s);
        }

        // Dòng 13
        if (profile.declared() != null && item.category() != null) {
            String bestCat = null;
            double maxProd = 0.0;
            for (Map.Entry<String, Double> e : item.category().entrySet()) {
                String catSlug = e.getKey();
                double xVal = e.getValue() != null ? e.getValue() : 0.0;
                double eVal = profile.declared().category().getOrDefault(catSlug, 0.0);
                double prod = eVal * xVal;
                if (prod > maxProd) {
                    maxProd = prod;
                    bestCat = catSlug;
                }
            }
            if (bestCat != null) {
                return "Thuộc danh mục " + categoryName(bestCat) + " bạn quan tâm";
            }
        }

        // Dòng 14
        return "Hợp với sở thích màu bạn đã chọn";
    }

    private String findBStar(Map<String, Double> contributions) {
        if (contributions == null || contributions.isEmpty()) {
            return null;
        }
        String[] order = {"style", "color", "tag", "category", "creator"};
        String bStar = null;
        double maxVal = 0.0;
        for (String key : order) {
            Double val = contributions.get(key);
            if (val != null && val > maxVal) {
                maxVal = val;
                bStar = key;
            }
        }
        return bStar;
    }

    private PositiveAnchor findBestStyleAnchor(Map<Integer, PositiveAnchor> positiveHistory, ItemVector item, String style) {
        if (style == null || style.isBlank()) {
            return null;
        }
        PositiveAnchor best = null;
        double bestSim = Double.NEGATIVE_INFINITY;

        for (PositiveAnchor anchor : positiveHistory.values()) {
            if (anchor.id() == item.id()) {
                continue;
            }
            ItemVector aVec = itemOf != null ? itemOf.apply(anchor.id()) : null;
            if (aVec == null || aVec.style() == null || !style.equalsIgnoreCase(aVec.style().trim())) {
                continue;
            }
            double sim = ScoreCalculator.itemSim(aVec, item, props.normalizedWeights());
            if (best == null) {
                best = anchor;
                bestSim = sim;
            } else {
                double diff = sim - bestSim;
                if (Math.abs(diff) < 1e-12) {
                    if (anchor.sumAbsWeight() > best.sumAbsWeight()) {
                        best = anchor;
                        bestSim = sim;
                    } else if (anchor.sumAbsWeight() == best.sumAbsWeight() && anchor.id() < best.id()) {
                        best = anchor;
                        bestSim = sim;
                    }
                } else if (diff > 0) {
                    best = anchor;
                    bestSim = sim;
                }
            }
        }
        return best;
    }

    private PositiveAnchor findBestColorAnchor(Map<Integer, PositiveAnchor> positiveHistory, ItemVector item) {
        PositiveAnchor best = null;
        double bestRbf = Double.NEGATIVE_INFINITY;

        for (PositiveAnchor anchor : positiveHistory.values()) {
            if (anchor.id() == item.id()) {
                continue;
            }
            ItemVector aVec = itemOf != null ? itemOf.apply(anchor.id()) : null;
            if (aVec == null) {
                continue;
            }
            double r = ScoreCalculator.rbf(aVec.color(), item.color());
            if (best == null) {
                best = anchor;
                bestRbf = r;
            } else {
                double diff = r - bestRbf;
                if (Math.abs(diff) < 1e-12) {
                    if (anchor.sumAbsWeight() > best.sumAbsWeight()) {
                        best = anchor;
                        bestRbf = r;
                    } else if (anchor.sumAbsWeight() == best.sumAbsWeight() && anchor.id() < best.id()) {
                        best = anchor;
                        bestRbf = r;
                    }
                } else if (diff > 0) {
                    best = anchor;
                    bestRbf = r;
                }
            }
        }
        return best;
    }

    private String findBestTag(UserProfile profile, ItemVector item) {
        if (profile.mixed() == null || profile.mixed().tag() == null || item.tag() == null) {
            return null;
        }
        String best = null;
        double maxProd = 0.0;
        for (Map.Entry<String, Double> e : item.tag().entrySet()) {
            String tag = e.getKey();
            double xVal = e.getValue() != null ? e.getValue() : 0.0;
            double pVal = profile.mixed().tag().getOrDefault(tag, 0.0);
            double prod = pVal * xVal;
            if (prod > maxProd) {
                maxProd = prod;
                best = tag;
            }
        }
        return best;
    }

    private String findBestCategory(UserProfile profile, ItemVector item) {
        if (profile.mixed() == null || profile.mixed().category() == null || item.category() == null) {
            return null;
        }
        String best = null;
        double maxProd = 0.0;
        for (Map.Entry<String, Double> e : item.category().entrySet()) {
            String cat = e.getKey();
            double xVal = e.getValue() != null ? e.getValue() : 0.0;
            double pVal = profile.mixed().category().getOrDefault(cat, 0.0);
            double prod = pVal * xVal;
            if (prod > maxProd) {
                maxProd = prod;
                best = cat;
            }
        }
        return best;
    }

    private String styleName(String slug) {
        if (slug == null) return "";
        String name = categoryNames.get(slug);
        return (name != null && !name.isBlank()) ? name : slug;
    }

    private String categoryName(String slug) {
        if (slug == null) return "";
        String name = categoryNames.get(slug);
        return (name != null && !name.isBlank()) ? name : slug;
    }

    private Map<Integer, PositiveAnchor> extractPositiveHistory(UserProfile profile) {
        if (profile == null || profile.signals() == null) {
            return Collections.emptyMap();
        }
        Map<Integer, AnchorAccumulator> map = new LinkedHashMap<>();
        for (UserSignal s : profile.signals()) {
            if (s.getLutId() == null || s.getType() == null) {
                continue;
            }
            double w = s.getWeight() != null ? s.getWeight() : 0.0;
            if (w <= 0) {
                continue;
            }
            String type = s.getType().toUpperCase();
            if (!Set.of("PURCHASE", "DOWNLOAD", "FAVORITE", "PREVIEW", "VIEW").contains(type)) {
                continue;
            }
            map.computeIfAbsent(s.getLutId(), id -> new AnchorAccumulator(id)).addSignal(type, Math.abs(w), props);
        }

        Map<Integer, PositiveAnchor> result = new LinkedHashMap<>(map.size());
        for (Map.Entry<Integer, AnchorAccumulator> e : map.entrySet()) {
            result.put(e.getKey(), e.getValue().toAnchor());
        }
        return result;
    }

    private record PositiveAnchor(int id, String strongestType, double sumAbsWeight, String verb) {}

    private static class AnchorAccumulator {
        private final int id;
        private String strongestType;
        private double maxTypeWeight = -1.0;
        private double sumAbsWeight = 0.0;

        public AnchorAccumulator(int id) {
            this.id = id;
        }

        public void addSignal(String type, double absWeight, RecommendProperties props) {
            this.sumAbsWeight += absWeight;
            double tw = typeWeight(type, props);
            if (tw > maxTypeWeight) {
                maxTypeWeight = tw;
                strongestType = type;
            }
        }

        private static double typeWeight(String type, RecommendProperties props) {
            if (type == null) return 0.0;
            return switch (type.toUpperCase()) {
                case "PURCHASE" -> 6.0;
                case "DOWNLOAD" -> 5.0;
                case "FAVORITE" -> 4.0;
                case "PREVIEW" -> 2.0;
                case "VIEW" -> 1.0;
                default -> 0.0;
            };
        }

        public PositiveAnchor toAnchor() {
            String verb = switch (strongestType != null ? strongestType.toUpperCase() : "") {
                case "PURCHASE" -> "đã chọn khi mua gói";
                case "DOWNLOAD" -> "đã tải";
                case "FAVORITE" -> "đã lưu";
                default -> "đã xem"; // PREVIEW or VIEW
            };
            return new PositiveAnchor(id, strongestType, sumAbsWeight, verb);
        }
    }
}
