package vn.aeoc.business.recommend.service;

import org.springframework.stereotype.Component;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.entity.data.mysql.recommend.LutSimilarity;

import java.util.*;

@Component
public class SimilarityService {

    public static double rbf(double[] z1, double[] z2) {
        if (z1 == null || z2 == null) {
            return 0.0;
        }
        int len = Math.min(10, Math.min(z1.length, z2.length));
        double sumSq = 0.0;
        for (int d = 0; d < len; d++) {
            double diff = z1[d] - z2[d];
            sumSq += diff * diff;
        }
        return Math.exp(-sumSq / 20.0);
    }

    public Map<String, Double> blockSims(LutVectorIndex ix, int i, int j) {
        double tagSim = dotProduct(ix.tagVector(i), ix.tagVector(j));
        double catSim = dotProduct(ix.categoryVector(i), ix.categoryVector(j));
        double textSim = dotProduct(ix.textVector(i), ix.textVector(j));
        double colorSim = rbf(ix.colorZ(i), ix.colorZ(j));

        String styleI = ix.style(i);
        String styleJ = ix.style(j);
        double styleSim = (styleI != null && !styleI.isBlank() && styleI.equals(styleJ)) ? 1.0 : 0.0;

        Integer creatorI = ix.creatorId(i);
        Integer creatorJ = ix.creatorId(j);
        double creatorSim = (creatorI != null && creatorI.equals(creatorJ)) ? 1.0 : 0.0;

        Map<String, Double> map = new LinkedHashMap<>();
        map.put("tag", tagSim);
        map.put("color", colorSim);
        map.put("category", catSim);
        map.put("style", styleSim);
        map.put("text", textSim);
        map.put("creator", creatorSim);
        return map;
    }

    public Map<String, Double> blockSims(LutVectorIndex ix, Integer i, Integer j) {
        return blockSims(ix, i.intValue(), j.intValue());
    }

    public double sim(LutVectorIndex ix, int i, int j) {
        RecommendProperties.Weights w = ix.getProperties().normalizedWeights();
        Map<String, Double> blocks = blockSims(ix, i, j);
        double sum = w.getTag() * blocks.get("tag")
                + w.getColor() * blocks.get("color")
                + w.getCategory() * blocks.get("category")
                + w.getStyle() * blocks.get("style")
                + w.getText() * blocks.get("text")
                + w.getCreator() * blocks.get("creator");
        return Math.max(0.0, Math.min(1.0, sum));
    }

    public double sim(LutVectorIndex ix, Integer i, Integer j) {
        return sim(ix, i.intValue(), j.intValue());
    }

    public List<LutSimilarity> topSimilar(LutVectorIndex ix) {
        List<Integer> ids = ix.ids();
        int n = ids.size();
        if (n <= 1) {
            return Collections.emptyList();
        }

        int topLimit = ix.getProperties().getSimilarityTop();
        double[][] simMatrix = new double[n][n];

        for (int a = 0; a < n; a++) {
            simMatrix[a][a] = 1.0;
            for (int b = a + 1; b < n; b++) {
                double s = sim(ix, ids.get(a), ids.get(b));
                simMatrix[a][b] = s;
                simMatrix[b][a] = s;
            }
        }

        List<LutSimilarity> result = new ArrayList<>(n * Math.min(topLimit, n - 1));

        for (int a = 0; a < n; a++) {
            int idA = ids.get(a);
            List<Neighbor> neighbors = new ArrayList<>(n - 1);
            for (int b = 0; b < n; b++) {
                if (a == b) continue;
                int idB = ids.get(b);
                neighbors.add(new Neighbor(idB, simMatrix[a][b], ix.downloadCount(idB)));
            }

            neighbors.sort(NEIGHBOR_COMPARATOR);

            int limit = Math.min(topLimit, neighbors.size());
            for (int k = 0; k < limit; k++) {
                Neighbor nb = neighbors.get(k);
                result.add(new LutSimilarity(idA, nb.id, nb.sim));
            }
        }

        return result;
    }

    private static double dotProduct(Map<String, Double> v1, Map<String, Double> v2) {
        if (v1 == null || v2 == null || v1.isEmpty() || v2.isEmpty()) {
            return 0.0;
        }
        Map<String, Double> smaller = v1.size() <= v2.size() ? v1 : v2;
        Map<String, Double> larger = smaller == v1 ? v2 : v1;
        double sum = 0.0;
        for (Map.Entry<String, Double> entry : smaller.entrySet()) {
            Double w2 = larger.get(entry.getKey());
            if (w2 != null) {
                sum += entry.getValue() * w2;
            }
        }
        return sum;
    }

    private static final Comparator<Neighbor> NEIGHBOR_COMPARATOR = (o1, o2) -> {
        int cmp = Double.compare(o2.sim, o1.sim);
        if (cmp != 0) return cmp;
        cmp = Integer.compare(o2.downloadCount, o1.downloadCount);
        if (cmp != 0) return cmp;
        return Integer.compare(o1.id, o2.id);
    };

    private record Neighbor(int id, double sim, int downloadCount) {}
}
