package vn.aeoc.business.recommend.rank;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.business.recommend.profile.ProfileVector;

import java.util.LinkedHashMap;
import java.util.Map;

public final class ScoreCalculator {

    private ScoreCalculator() {}

    public static double cosine(Map<String, Double> a, Map<String, Double> b) {
        if (a == null || b == null || a.isEmpty() || b.isEmpty()) {
            return 0.0;
        }
        double normASq = 0.0;
        for (double v : a.values()) {
            normASq += v * v;
        }
        if (normASq <= 0.0) {
            return 0.0;
        }

        double normBSq = 0.0;
        for (double v : b.values()) {
            normBSq += v * v;
        }
        if (normBSq <= 0.0) {
            return 0.0;
        }

        Map<String, Double> smaller = a.size() <= b.size() ? a : b;
        Map<String, Double> larger = smaller == a ? b : a;
        double dot = 0.0;
        for (Map.Entry<String, Double> e : smaller.entrySet()) {
            Double val2 = larger.get(e.getKey());
            if (val2 != null) {
                dot += e.getValue() * val2;
            }
        }
        return dot / (Math.sqrt(normASq) * Math.sqrt(normBSq));
    }

    public static double rbf(double[] a, double[] b) {
        if (a == null || b == null || a.length == 0 || b.length == 0) {
            return 0.0;
        }
        int d = a.length;
        int len = Math.min(a.length, b.length);
        double sumSq = 0.0;
        for (int i = 0; i < len; i++) {
            double diff = a[i] - b[i];
            sumSq += diff * diff;
        }
        if (a.length > len) {
            for (int i = len; i < a.length; i++) {
                sumSq += a[i] * a[i];
            }
        } else if (b.length > len) {
            for (int i = len; i < b.length; i++) {
                sumSq += b[i] * b[i];
            }
        }
        return Math.exp(-sumSq / (2.0 * d));
    }

    public static Map<String, Double> contributions(ProfileVector p, ItemVector x, RecommendProperties.Weights w) {
        Map<String, Double> res = new LinkedHashMap<>(6);
        if (p == null || x == null || w == null) {
            res.put("tag", 0.0);
            res.put("color", 0.0);
            res.put("category", 0.0);
            res.put("style", 0.0);
            res.put("text", 0.0);
            res.put("creator", 0.0);
            return res;
        }

        double tagSim = cosine(p.tag(), x.tag());
        double colorSim = rbf(p.color(), x.color());
        double catSim = cosine(p.category(), x.category());

        Map<String, Double> xStyleMap = (x.style() != null && !x.style().isBlank())
                ? Map.of(x.style().trim(), 1.0)
                : Map.of();
        double styleSim = cosine(p.style(), xStyleMap);

        double textSim = cosine(p.text(), x.text());

        Map<String, Double> xCreatorMap = (x.creatorId() != null)
                ? Map.of(String.valueOf(x.creatorId()), 1.0)
                : Map.of();
        double creatorSim = cosine(p.creator(), xCreatorMap);

        res.put("tag", w.getTag() * tagSim);
        res.put("color", w.getColor() * colorSim);
        res.put("category", w.getCategory() * catSim);
        res.put("style", w.getStyle() * styleSim);
        res.put("text", w.getText() * textSim);
        res.put("creator", w.getCreator() * creatorSim);
        return res;
    }

    public static double score(ProfileVector p, ItemVector x, RecommendProperties.Weights w) {
        Map<String, Double> cont = contributions(p, x, w);
        double s = 0.0;
        for (double v : cont.values()) {
            s += v;
        }
        return s;
    }

    public static double itemSim(ItemVector a, ItemVector b, RecommendProperties.Weights w) {
        if (a == null || b == null || w == null) {
            return 0.0;
        }
        double tagSim = cosine(a.tag(), b.tag());
        double colorSim = rbf(a.color(), b.color());
        double catSim = cosine(a.category(), b.category());
        double styleSim = (a.style() != null && !a.style().isBlank() && a.style().equals(b.style())) ? 1.0 : 0.0;
        double textSim = cosine(a.text(), b.text());
        double creatorSim = (a.creatorId() != null && a.creatorId().equals(b.creatorId())) ? 1.0 : 0.0;

        double sum = w.getTag() * tagSim
                + w.getColor() * colorSim
                + w.getCategory() * catSim
                + w.getStyle() * styleSim
                + w.getText() * textSim
                + w.getCreator() * creatorSim;
        return Math.max(0.0, Math.min(1.0, sum));
    }
}
