package vn.aeoc.business.recommend.index;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.lut.LutColorFeature;

import java.util.*;

public class LutVectorIndex {

    private static final Logger log = LoggerFactory.getLogger(LutVectorIndex.class);

    private static final Set<String> SOFTWARE_CATEGORIES = Set.of(
            "premiere-pro", "davinci-resolve", "final-cut-pro", "capcut"
    );

    private final RecommendProperties properties;
    private final List<Integer> ids;
    private final Set<Integer> idSet;

    private final Map<String, Double> tagIdfMap;
    private final Map<String, Double> categoryIdfMap;
    private final Map<String, Double> textIdfMap;

    private final Map<Integer, Map<String, Double>> tagVectors;
    private final Map<Integer, Map<String, Double>> categoryVectors;
    private final Map<Integer, Map<String, Double>> textVectors;

    private final Map<Integer, double[]> colorZMap;
    private final double[] colorMean;
    private final double[] colorStd;

    private final Map<Integer, String> styles;
    private final Map<Integer, Integer> creatorIds;
    private final Map<Integer, Integer> downloadCounts;

    private LutVectorIndex(RecommendProperties properties,
                           List<Integer> ids,
                           Map<String, Double> tagIdfMap,
                           Map<String, Double> categoryIdfMap,
                           Map<String, Double> textIdfMap,
                           Map<Integer, Map<String, Double>> tagVectors,
                           Map<Integer, Map<String, Double>> categoryVectors,
                           Map<Integer, Map<String, Double>> textVectors,
                           Map<Integer, double[]> colorZMap,
                           double[] colorMean,
                           double[] colorStd,
                           Map<Integer, String> styles,
                           Map<Integer, Integer> creatorIds,
                           Map<Integer, Integer> downloadCounts) {
        this.properties = properties;
        this.ids = Collections.unmodifiableList(ids);
        this.idSet = new HashSet<>(ids);
        this.tagIdfMap = Collections.unmodifiableMap(tagIdfMap);
        this.categoryIdfMap = Collections.unmodifiableMap(categoryIdfMap);
        this.textIdfMap = Collections.unmodifiableMap(textIdfMap);
        this.tagVectors = Collections.unmodifiableMap(tagVectors);
        this.categoryVectors = Collections.unmodifiableMap(categoryVectors);
        this.textVectors = Collections.unmodifiableMap(textVectors);
        this.colorZMap = Collections.unmodifiableMap(colorZMap);
        this.colorMean = Arrays.copyOf(colorMean, colorMean.length);
        this.colorStd = Arrays.copyOf(colorStd, colorStd.length);
        this.styles = Collections.unmodifiableMap(styles);
        this.creatorIds = Collections.unmodifiableMap(creatorIds);
        this.downloadCounts = Collections.unmodifiableMap(downloadCounts);
    }

    public static LutVectorIndex build(List<Lut> luts, RecommendProperties props) {
        if (luts == null) {
            luts = Collections.emptyList();
        }
        if (props == null) {
            props = new RecommendProperties();
        }

        int N = luts.size();
        List<Integer> ids = new ArrayList<>(N);
        Map<Integer, String> styles = new HashMap<>(N);
        Map<Integer, Integer> creatorIds = new HashMap<>(N);
        Map<Integer, Integer> downloadCounts = new HashMap<>(N);

        for (Lut lut : luts) {
            Integer id = lut.getId();
            ids.add(id);
            styles.put(id, lut.getStyle());
            creatorIds.put(id, lut.getCreatorId());
            downloadCounts.put(id, lut.getDownloadCount() != null ? lut.getDownloadCount() : 0);
        }

        // 1. Tags
        Map<String, String> synonymMap = TagNormalizer.buildSynonymMap(props.getTagSynonyms());
        Map<Integer, Set<String>> lutNormalizedTags = new HashMap<>(N);
        Map<String, Integer> tagDf = new HashMap<>();

        for (Lut lut : luts) {
            Set<String> normTags = TagNormalizer.normalizeTags(lut.getTags(), synonymMap);
            lutNormalizedTags.put(lut.getId(), normTags);
            for (String tag : normTags) {
                tagDf.merge(tag, 1, Integer::sum);
            }
        }

        Map<String, Double> tagIdfMap = new HashMap<>(tagDf.size());
        for (Map.Entry<String, Integer> entry : tagDf.entrySet()) {
            tagIdfMap.put(entry.getKey(), computeIdf(N, entry.getValue()));
        }

        Map<Integer, Map<String, Double>> tagVectors = new HashMap<>(N);
        for (Lut lut : luts) {
            Set<String> normTags = lutNormalizedTags.get(lut.getId());
            Map<String, Double> weights = new HashMap<>();
            double sumSq = 0.0;
            for (String tag : normTags) {
                double w = tagIdfMap.getOrDefault(tag, 0.0);
                weights.put(tag, w);
                sumSq += w * w;
            }
            tagVectors.put(lut.getId(), normalizeL2(weights, sumSq));
        }

        // 2. Categories (filter non-software)
        Map<Integer, Set<String>> lutCategories = new HashMap<>(N);
        Map<String, Integer> categoryDf = new HashMap<>();

        for (Lut lut : luts) {
            Set<String> cats = new LinkedHashSet<>();
            if (lut.getCategories() != null) {
                for (String c : lut.getCategories()) {
                    if (c != null && !c.isBlank() && !SOFTWARE_CATEGORIES.contains(c.trim())) {
                        cats.add(c.trim());
                    }
                }
            }
            lutCategories.put(lut.getId(), cats);
            for (String c : cats) {
                categoryDf.merge(c, 1, Integer::sum);
            }
        }

        Map<String, Double> categoryIdfMap = new HashMap<>(categoryDf.size());
        for (Map.Entry<String, Integer> entry : categoryDf.entrySet()) {
            categoryIdfMap.put(entry.getKey(), computeIdf(N, entry.getValue()));
        }

        Map<Integer, Map<String, Double>> categoryVectors = new HashMap<>(N);
        for (Lut lut : luts) {
            Set<String> cats = lutCategories.get(lut.getId());
            Map<String, Double> weights = new HashMap<>();
            double sumSq = 0.0;
            for (String c : cats) {
                double w = categoryIdfMap.getOrDefault(c, 0.0);
                weights.put(c, w);
                sumSq += w * w;
            }
            categoryVectors.put(lut.getId(), normalizeL2(weights, sumSq));
        }

        // 3. Text (unigrams + bigrams with df >= 2)
        Set<String> stopwords = new HashSet<>(props.getTextStopwords());
        Map<Integer, TextTokenizer.TokenResult> lutTokens = new HashMap<>(N);
        Map<String, Integer> unigramDf = new HashMap<>();
        Map<String, Integer> bigramDf = new HashMap<>();

        for (Lut lut : luts) {
            TextTokenizer.TokenResult tr = TextTokenizer.tokenize(lut.getTitle(), lut.getDescription(), stopwords);
            lutTokens.put(lut.getId(), tr);
            for (String u : tr.unigrams().keySet()) {
                unigramDf.merge(u, 1, Integer::sum);
            }
            for (String b : tr.bigrams().keySet()) {
                bigramDf.merge(b, 1, Integer::sum);
            }
        }

        Map<String, Double> textIdfMap = new HashMap<>();
        for (Map.Entry<String, Integer> entry : unigramDf.entrySet()) {
            textIdfMap.put(entry.getKey(), computeIdf(N, entry.getValue()));
        }
        for (Map.Entry<String, Integer> entry : bigramDf.entrySet()) {
            if (entry.getValue() >= 2) {
                textIdfMap.put(entry.getKey(), computeIdf(N, entry.getValue()));
            }
        }

        Map<Integer, Map<String, Double>> textVectors = new HashMap<>(N);
        for (Lut lut : luts) {
            TextTokenizer.TokenResult tr = lutTokens.get(lut.getId());
            Map<String, Double> weights = new HashMap<>();
            double sumSq = 0.0;

            // Unigrams
            for (Map.Entry<String, Integer> entry : tr.unigrams().entrySet()) {
                String term = entry.getKey();
                int count = entry.getValue();
                double idf = textIdfMap.getOrDefault(term, 0.0);
                double w = (1.0 + Math.log(count)) * idf;
                weights.put(term, w);
                sumSq += w * w;
            }

            // Bigrams (only if df >= 2)
            for (Map.Entry<String, Integer> entry : tr.bigrams().entrySet()) {
                String term = entry.getKey();
                if (bigramDf.getOrDefault(term, 0) >= 2) {
                    int count = entry.getValue();
                    double idf = textIdfMap.getOrDefault(term, 0.0);
                    double w = (1.0 + Math.log(count)) * idf;
                    weights.put(term, w);
                    sumSq += w * w;
                }
            }

            textVectors.put(lut.getId(), normalizeL2(weights, sumSq));
        }

        // 4. Color (10 dimensions)
        List<Lut> validColorLuts = new ArrayList<>();
        for (Lut lut : luts) {
            if (lut.getColorFeature() != null) {
                validColorLuts.add(lut);
            }
        }

        int missingColorCount = N - validColorLuts.size();
        if (missingColorCount > 0) {
            log.warn("Có {}/{} LUT thiếu đặc trưng màu", missingColorCount, N);
        }

        double[] colorMean = new double[10];
        double[] colorStd = new double[10];
        int m = validColorLuts.size();

        if (m > 0) {
            for (int d = 0; d < 10; d++) {
                double sum = 0.0;
                for (Lut lut : validColorLuts) {
                    sum += getColorDim(lut.getColorFeature(), d);
                }
                colorMean[d] = sum / m;

                double sumSqDiff = 0.0;
                for (Lut lut : validColorLuts) {
                    double diff = getColorDim(lut.getColorFeature(), d) - colorMean[d];
                    sumSqDiff += diff * diff;
                }
                colorStd[d] = Math.sqrt(sumSqDiff / m);
            }
        }

        Map<Integer, double[]> colorZMap = new HashMap<>(N);
        for (Lut lut : luts) {
            double[] z = new double[10];
            if (lut.getColorFeature() != null) {
                for (int d = 0; d < 10; d++) {
                    if (colorStd[d] < 1e-12) {
                        z[d] = 0.0;
                    } else {
                        double v = (getColorDim(lut.getColorFeature(), d) - colorMean[d]) / colorStd[d];
                        z[d] = Math.max(-3.0, Math.min(3.0, v));
                    }
                }
            }
            colorZMap.put(lut.getId(), z);
        }

        return new LutVectorIndex(
                props, ids, tagIdfMap, categoryIdfMap, textIdfMap,
                tagVectors, categoryVectors, textVectors,
                colorZMap, colorMean, colorStd,
                styles, creatorIds, downloadCounts
        );
    }

    private static double computeIdf(int n, int df) {
        return Math.log((double) (n + 1) / (double) (df + 1)) + 1.0;
    }

    private static Map<String, Double> normalizeL2(Map<String, Double> weights, double sumSq) {
        if (weights.isEmpty() || sumSq <= 0.0) {
            return Collections.emptyMap();
        }
        double norm = Math.sqrt(sumSq);
        Map<String, Double> result = new LinkedHashMap<>(weights.size());
        for (Map.Entry<String, Double> entry : weights.entrySet()) {
            result.put(entry.getKey(), entry.getValue() / norm);
        }
        return Collections.unmodifiableMap(result);
    }

    private static double getColorDim(LutColorFeature f, int d) {
        if (f == null) return 0.0;
        return switch (d) {
            case 0 -> f.getBrightness() != null ? f.getBrightness() : 0.0;
            case 1 -> f.getContrast() != null ? f.getContrast() : 0.0;
            case 2 -> f.getSaturation() != null ? f.getSaturation() : 0.0;
            case 3 -> f.getWarmth() != null ? f.getWarmth() : 0.0;
            case 4 -> f.getTint() != null ? f.getTint() : 0.0;
            case 5 -> f.getShadowA() != null ? f.getShadowA() : 0.0;
            case 6 -> f.getShadowB() != null ? f.getShadowB() : 0.0;
            case 7 -> f.getHighlightA() != null ? f.getHighlightA() : 0.0;
            case 8 -> f.getHighlightB() != null ? f.getHighlightB() : 0.0;
            case 9 -> f.getIsMono() != null ? f.getIsMono().doubleValue() : 0.0;
            default -> 0.0;
        };
    }

    public int size() {
        return ids.size();
    }

    public List<Integer> ids() {
        return ids;
    }

    public boolean contains(int id) {
        return idSet.contains(id);
    }

    public double tagIdf(String tag) {
        if (tag == null) return 0.0;
        if (tagIdfMap.containsKey(tag)) {
            return tagIdfMap.get(tag);
        }
        String norm = TagNormalizer.normalize(tag, TagNormalizer.buildSynonymMap(properties.getTagSynonyms()));
        return tagIdfMap.getOrDefault(norm, 0.0);
    }

    public double categoryIdf(String category) {
        return categoryIdfMap.getOrDefault(category, 0.0);
    }

    public double textIdf(String term) {
        return textIdfMap.getOrDefault(term, 0.0);
    }

    public Map<String, Double> tagVector(Integer id) {
        return tagVectors.getOrDefault(id, Collections.emptyMap());
    }

    public Map<String, Double> categoryVector(Integer id) {
        return categoryVectors.getOrDefault(id, Collections.emptyMap());
    }

    public Map<String, Double> textVector(Integer id) {
        return textVectors.getOrDefault(id, Collections.emptyMap());
    }

    public double[] colorZ(Integer id) {
        double[] z = colorZMap.get(id);
        return z != null ? Arrays.copyOf(z, z.length) : new double[10];
    }

    public double[] colorMean() {
        return Arrays.copyOf(colorMean, colorMean.length);
    }

    public double[] colorStd() {
        return Arrays.copyOf(colorStd, colorStd.length);
    }

    public int downloadCount(Integer id) {
        return downloadCounts.getOrDefault(id, 0);
    }

    public String style(Integer id) {
        return styles.get(id);
    }

    public Integer creatorId(Integer id) {
        return creatorIds.get(id);
    }

    public RecommendProperties getProperties() {
        return properties;
    }
}
