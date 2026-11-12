package vn.aeoc.business.recommend.eval.tune;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.rank.ScoreCalculator;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ItemSimMatrix {

    private final int n;
    private final double[] data;
    private final int[] idMap;
    private final Map<Integer, Integer> fallbackMap;

    private ItemSimMatrix(int n, double[] data, int[] idMap, Map<Integer, Integer> fallbackMap) {
        this.n = n;
        this.data = data;
        this.idMap = idMap;
        this.fallbackMap = fallbackMap;
    }

    public static ItemSimMatrix build(LutVectorIndex ix) {
        if (ix == null || ix.items() == null) {
            return new ItemSimMatrix(0, new double[0], new int[0], Map.of());
        }

        List<ItemVector> items = ix.items();
        int n = items.size();

        int maxId = 0;
        for (ItemVector iv : items) {
            if (iv.id() > maxId) {
                maxId = iv.id();
            }
        }

        int[] idMap = null;
        Map<Integer, Integer> fallbackMap = null;
        if (maxId >= 0 && maxId < 100_000) {
            idMap = new int[maxId + 1];
            Arrays.fill(idMap, -1);
            for (int i = 0; i < n; i++) {
                idMap[items.get(i).id()] = i;
            }
        } else {
            fallbackMap = new HashMap<>(n);
            for (int i = 0; i < n; i++) {
                fallbackMap.put(items.get(i).id(), i);
            }
        }

        double[] data = new double[n * n * 6];

        for (int i = 0; i < n; i++) {
            ItemVector a = items.get(i);
            for (int j = 0; j < n; j++) {
                ItemVector b = items.get(j);
                int base = (i * n + j) * 6;
                data[base] = ScoreCalculator.cosine(a.tag(), b.tag());
                data[base + 1] = ScoreCalculator.rbf(a.color(), b.color());
                data[base + 2] = ScoreCalculator.cosine(a.category(), b.category());
                data[base + 3] = (a.style() != null && !a.style().isBlank() && a.style().equals(b.style())) ? 1.0 : 0.0;
                data[base + 4] = ScoreCalculator.cosine(a.text(), b.text());
                data[base + 5] = (a.creatorId() != null && a.creatorId().equals(b.creatorId())) ? 1.0 : 0.0;
            }
        }

        return new ItemSimMatrix(n, data, idMap, fallbackMap);
    }

    public int indexOf(int id) {
        if (idMap != null && id >= 0 && id < idMap.length) {
            return idMap[id];
        }
        if (fallbackMap != null) {
            return fallbackMap.getOrDefault(id, -1);
        }
        return -1;
    }

    public double sim(int idA, int idB, RecommendProperties.Weights w) {
        int i = indexOf(idA);
        int j = indexOf(idB);
        if (i < 0 || j < 0 || w == null) {
            return 0.0;
        }

        int base = (i * n + j) * 6;
        double sum = w.getTag() * data[base]
                + w.getColor() * data[base + 1]
                + w.getCategory() * data[base + 2]
                + w.getStyle() * data[base + 3]
                + w.getText() * data[base + 4]
                + w.getCreator() * data[base + 5];

        return Math.max(0.0, Math.min(1.0, sum));
    }
}
