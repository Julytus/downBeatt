package vn.aeoc.business.recommend.profile;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.index.TagNormalizer;
import vn.aeoc.business.recommend.index.TextTokenizer;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class ProfileBuilder {

    public static UserProfile build(LutVectorIndex ix,
                                    List<UserSignal> rawSignals,
                                    List<String> preferenceSlugs,
                                    LocalDateTime now,
                                    RecommendProperties p) {
        if (ix == null) {
            return UserProfile.empty();
        }
        if (p == null) {
            p = new RecommendProperties();
        }
        if (now == null) {
            now = LocalDateTime.now();
        }

        // 1. Synonym map & stopwords
        Map<String, String> synonymMap = TagNormalizer.buildSynonymMap(p.getTagSynonyms());
        Set<String> stopwords = new HashSet<>(p.getTextStopwords());

        // 2. Filter raw signals
        LocalDateTime cutoff = now.minusDays(p.getHistoryDays());
        List<SignalCandidate> candidates = new ArrayList<>();

        if (rawSignals != null) {
            for (UserSignal sig : rawSignals) {
                if (sig == null || sig.getType() == null) {
                    continue;
                }
                if (sig.getLastTime() != null && sig.getLastTime().isBefore(cutoff)) {
                    continue;
                }

                String type = sig.getType().toUpperCase(Locale.ROOT);
                if ("VIEW".equals(type) || "PREVIEW".equals(type) || "FAVORITE".equals(type)
                        || "DOWNLOAD".equals(type) || "PURCHASE".equals(type) || "DISMISS".equals(type)) {
                    if (sig.getLutId() == null || !ix.contains(sig.getLutId())) {
                        continue;
                    }
                    candidates.add(new SignalCandidate(sig, type, null, null));
                } else if ("SEARCH".equals(type)) {
                    if (sig.getValue() == null) {
                        continue;
                    }
                    String kw = TagNormalizer.normalize(sig.getValue(), synonymMap);
                    Map<String, Double> searchTag = buildSearchTagVector(kw, ix);
                    Map<String, Double> searchText = buildSearchTextVector(kw, ix, stopwords);
                    if (searchTag.isEmpty() && searchText.isEmpty()) {
                        continue;
                    }
                    candidates.add(new SignalCandidate(sig, type, searchTag, searchText));
                } else if ("FILTER_STYLE".equals(type)) {
                    if (sig.getValue() == null || !ix.styleSet().contains(sig.getValue().trim())) {
                        continue;
                    }
                    candidates.add(new SignalCandidate(sig, type, null, null));
                }
            }
        }

        // 3. Sort by lastTime descending, take up to history-max-pairs
        candidates.sort((c1, c2) -> {
            LocalDateTime t1 = c1.signal.getLastTime();
            LocalDateTime t2 = c2.signal.getLastTime();
            if (t1 == null && t2 == null) return 0;
            if (t1 == null) return 1;
            if (t2 == null) return -1;
            return t2.compareTo(t1);
        });

        int maxPairs = p.getHistoryMaxPairs();
        if (candidates.size() > maxPairs) {
            candidates = candidates.subList(0, maxPairs);
        }

        // 4. Compute days, weight c, populate signal fields
        List<EvaluatedPair> pairs = new ArrayList<>(candidates.size());
        List<UserSignal> usedSignals = new ArrayList<>(candidates.size());

        for (SignalCandidate sc : candidates) {
            UserSignal sig = sc.signal;
            double days = 0.0;
            if (sig.getLastTime() != null && !sig.getLastTime().isAfter(now)) {
                long sec = ChronoUnit.SECONDS.between(sig.getLastTime(), now);
                days = Math.max(0.0, (double) sec / 86400.0);
            }

            int count = (sig.getCount() != null && sig.getCount() > 0) ? sig.getCount() : 1;
            double w = p.getEvent().weightOf(sc.type);
            double decay = (p.getHalfLifeDays() <= 0) ? 1.0 : Math.pow(0.5, days / p.getHalfLifeDays());
            double c = w * (1.0 + Math.log(count)) * decay;

            sig.setDays(round2(days));
            sig.setWeight(round4(c));
            if (sig.getLutId() != null) {
                sig.setSlug(ix.slug(sig.getLutId()));
            }

            usedSignals.add(sig);
            pairs.add(new EvaluatedPair(sc, c));
        }

        // 5 & 6. Behavior vector H_u
        ProfileVector behavior = computeBehaviorVector(pairs, ix);

        // 7. positiveLutCount (n) and hasBehavior
        Set<Integer> positiveLutIds = new HashSet<>();
        boolean hasBehavior = false;
        for (EvaluatedPair ep : pairs) {
            if (ep.c > 0) {
                hasBehavior = true;
                if (ep.candidate.signal.getLutId() != null) {
                    positiveLutIds.add(ep.candidate.signal.getLutId());
                }
            }
        }
        int positiveLutCount = positiveLutIds.size();

        // 8. Declared vector E_u
        List<String> rawPrefs = preferenceSlugs != null ? preferenceSlugs : List.of();
        ProfileVector declared = computeDeclaredVector(rawPrefs, ix);
        boolean hasDeclared = !declared.style().isEmpty() || !declared.category().isEmpty();

        // 9. Strategy & alpha
        String strategy;
        double alpha;
        double k = p.getColdStartK();

        if (positiveLutCount >= 1) {
            strategy = "PROFILE";
            alpha = hasDeclared ? (k / (k + positiveLutCount)) : 0.0;
        } else if (hasDeclared) {
            strategy = "PREFERENCE";
            alpha = 1.0;
        } else if (hasBehavior) {
            strategy = "PROFILE";
            alpha = 0.0;
        } else {
            strategy = "POPULAR";
            alpha = 0.0;
        }

        // 10. Mixed vector P_u
        ProfileVector mixed = computeMixedVector(declared, behavior, alpha);

        return new UserProfile(
                strategy,
                round4(alpha),
                positiveLutCount,
                declared,
                behavior,
                mixed,
                usedSignals,
                rawPrefs,
                ix
        );
    }

    private static ProfileVector computeBehaviorVector(List<EvaluatedPair> pairs, LutVectorIndex ix) {
        if (pairs.isEmpty()) {
            return ProfileVector.empty();
        }

        // 5 discrete blocks
        Map<String, Double> tagNumerator = new HashMap<>();
        double tagDenom = 0.0;

        Map<String, Double> categoryNumerator = new HashMap<>();
        double categoryDenom = 0.0;

        Map<String, Double> styleNumerator = new HashMap<>();
        double styleDenom = 0.0;

        Map<String, Double> textNumerator = new HashMap<>();
        double textDenom = 0.0;

        Map<String, Double> creatorNumerator = new HashMap<>();
        double creatorDenom = 0.0;

        double[] colorSum = new double[10];
        double colorDenom = 0.0;

        for (EvaluatedPair ep : pairs) {
            double c = ep.c;
            double absC = Math.abs(c);
            String type = ep.candidate.type;

            if ("SEARCH".equals(type)) {
                if (ep.candidate.searchTag != null && !ep.candidate.searchTag.isEmpty()) {
                    tagDenom += absC;
                    for (Map.Entry<String, Double> entry : ep.candidate.searchTag.entrySet()) {
                        tagNumerator.merge(entry.getKey(), c * entry.getValue(), Double::sum);
                    }
                }
                if (ep.candidate.searchText != null && !ep.candidate.searchText.isEmpty()) {
                    textDenom += absC;
                    for (Map.Entry<String, Double> entry : ep.candidate.searchText.entrySet()) {
                        textNumerator.merge(entry.getKey(), c * entry.getValue(), Double::sum);
                    }
                }
            } else if ("FILTER_STYLE".equals(type)) {
                styleDenom += absC;
                String styleVal = ep.candidate.signal.getValue().trim();
                styleNumerator.merge(styleVal, c * 1.0, Double::sum);
            } else {
                // LUT pair (VIEW, PREVIEW, FAVORITE, DOWNLOAD, PURCHASE, DISMISS)
                Integer lutId = ep.candidate.signal.getLutId();

                // tag
                tagDenom += absC;
                for (Map.Entry<String, Double> entry : ix.tagVector(lutId).entrySet()) {
                    tagNumerator.merge(entry.getKey(), c * entry.getValue(), Double::sum);
                }

                // category
                categoryDenom += absC;
                for (Map.Entry<String, Double> entry : ix.categoryVector(lutId).entrySet()) {
                    categoryNumerator.merge(entry.getKey(), c * entry.getValue(), Double::sum);
                }

                // style
                styleDenom += absC;
                String lutStyle = ix.style(lutId);
                if (lutStyle != null && !lutStyle.isBlank()) {
                    styleNumerator.merge(lutStyle.trim(), c * 1.0, Double::sum);
                }

                // text
                textDenom += absC;
                for (Map.Entry<String, Double> entry : ix.textVector(lutId).entrySet()) {
                    textNumerator.merge(entry.getKey(), c * entry.getValue(), Double::sum);
                }

                // creator
                creatorDenom += absC;
                Integer creatorId = ix.creatorId(lutId);
                if (creatorId != null) {
                    creatorNumerator.merge(String.valueOf(creatorId), c * 1.0, Double::sum);
                }

                // color (only if c > 0)
                if (c > 0) {
                    double[] z = ix.colorZ(lutId);
                    colorDenom += c;
                    for (int d = 0; d < 10; d++) {
                        colorSum[d] += c * z[d];
                    }
                }
            }
        }

        Map<String, Double> finalTag = divideMap(tagNumerator, tagDenom);
        Map<String, Double> finalCategory = divideMap(categoryNumerator, categoryDenom);
        Map<String, Double> finalStyle = divideMap(styleNumerator, styleDenom);
        Map<String, Double> finalText = divideMap(textNumerator, textDenom);
        Map<String, Double> finalCreator = divideMap(creatorNumerator, creatorDenom);

        double[] finalColor = null;
        if (colorDenom > 0) {
            finalColor = new double[10];
            for (int d = 0; d < 10; d++) {
                finalColor[d] = colorSum[d] / colorDenom;
            }
        }

        return new ProfileVector(finalTag, finalCategory, finalStyle, finalText, finalCreator, finalColor);
    }

    private static ProfileVector computeDeclaredVector(List<String> rawPrefs, LutVectorIndex ix) {
        if (rawPrefs.isEmpty()) {
            return ProfileVector.empty();
        }

        // 1. styles = slug in styleSet
        List<String> styles = new ArrayList<>();
        // 2. cats = slug in categoryDictionary
        List<String> cats = new ArrayList<>();

        for (String p : rawPrefs) {
            if (p == null) continue;
            String cleaned = p.trim().toLowerCase(Locale.ROOT);
            if (ix.styleSet().contains(cleaned)) {
                styles.add(cleaned);
            }
            if (ix.categoryDictionary().contains(cleaned)) {
                cats.add(cleaned);
            }
        }

        // style vector: 1 / |styles|
        Map<String, Double> declaredStyle = new HashMap<>();
        if (!styles.isEmpty()) {
            double w = 1.0 / (double) styles.size();
            for (String s : styles) {
                declaredStyle.put(s, w);
            }
        }

        // category vector: multi-hot cats * categoryIdf, normalized L2
        Map<String, Double> declaredCategory = new HashMap<>();
        if (!cats.isEmpty()) {
            double sumSq = 0.0;
            for (String c : cats) {
                double idf = ix.categoryIdf(c);
                declaredCategory.put(c, idf);
                sumSq += idf * idf;
            }
            if (sumSq > 0.0) {
                double norm = Math.sqrt(sumSq);
                for (Map.Entry<String, Double> entry : declaredCategory.entrySet()) {
                    entry.setValue(entry.getValue() / norm);
                }
            }
        }

        // Member LUTs: LUT whose categoryVector contains at least one slug of cats
        List<Integer> memberLutIds = new ArrayList<>();
        if (!cats.isEmpty()) {
            for (Integer id : ix.ids()) {
                Map<String, Double> catVec = ix.categoryVector(id);
                for (String c : cats) {
                    if (catVec.containsKey(c)) {
                        memberLutIds.add(id);
                        break;
                    }
                }
            }
        }

        Map<String, Double> declaredTag = new HashMap<>();
        Map<String, Double> declaredText = new HashMap<>();
        double[] declaredColor = null;

        if (!memberLutIds.isEmpty()) {
            double m = memberLutIds.size();
            for (Integer id : memberLutIds) {
                for (Map.Entry<String, Double> e : ix.tagVector(id).entrySet()) {
                    declaredTag.merge(e.getKey(), e.getValue() / m, Double::sum);
                }
                for (Map.Entry<String, Double> e : ix.textVector(id).entrySet()) {
                    declaredText.merge(e.getKey(), e.getValue() / m, Double::sum);
                }
            }

            declaredColor = new double[10];
            for (Integer id : memberLutIds) {
                double[] z = ix.colorZ(id);
                for (int d = 0; d < 10; d++) {
                    declaredColor[d] += z[d] / m;
                }
            }
        }

        return new ProfileVector(declaredTag, declaredCategory, declaredStyle, declaredText, Map.of(), declaredColor);
    }

    private static ProfileVector computeMixedVector(ProfileVector declared, ProfileVector behavior, double alpha) {
        Map<String, Double> mixedTag = mixDiscrete(declared.tag(), behavior.tag(), alpha);
        Map<String, Double> mixedCategory = mixDiscrete(declared.category(), behavior.category(), alpha);
        Map<String, Double> mixedStyle = mixDiscrete(declared.style(), behavior.style(), alpha);
        Map<String, Double> mixedText = mixDiscrete(declared.text(), behavior.text(), alpha);
        Map<String, Double> mixedCreator = mixDiscrete(declared.creator(), behavior.creator(), alpha);

        double[] dColor = declared.color();
        double[] bColor = behavior.color();
        double[] mixedColor;

        if (dColor != null && bColor != null) {
            mixedColor = new double[10];
            for (int d = 0; d < 10; d++) {
                mixedColor[d] = alpha * dColor[d] + (1.0 - alpha) * bColor[d];
            }
        } else if (dColor != null) {
            mixedColor = Arrays.copyOf(dColor, 10);
        } else if (bColor != null) {
            mixedColor = Arrays.copyOf(bColor, 10);
        } else {
            mixedColor = null;
        }

        return new ProfileVector(mixedTag, mixedCategory, mixedStyle, mixedText, mixedCreator, mixedColor);
    }

    private static Map<String, Double> mixDiscrete(Map<String, Double> declared, Map<String, Double> behavior, double alpha) {
        if (declared.isEmpty() && behavior.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<String> allKeys = new HashSet<>(declared.keySet());
        allKeys.addAll(behavior.keySet());

        Map<String, Double> result = new HashMap<>();
        for (String k : allKeys) {
            double vD = declared.getOrDefault(k, 0.0);
            double vB = behavior.getOrDefault(k, 0.0);
            double mix = alpha * vD + (1.0 - alpha) * vB;
            if (Math.abs(mix) > 1e-12) {
                result.put(k, mix);
            }
        }
        return result;
    }

    private static Map<String, Double> divideMap(Map<String, Double> numerator, double denom) {
        if (denom <= 0.0 || numerator.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<String, Double> res = new HashMap<>(numerator.size());
        for (Map.Entry<String, Double> entry : numerator.entrySet()) {
            res.put(entry.getKey(), entry.getValue() / denom);
        }
        return res;
    }

    private static Map<String, Double> buildSearchTagVector(String kw, LutVectorIndex ix) {
        if (kw == null || kw.isBlank()) {
            return Collections.emptyMap();
        }
        List<String> kwTokens = TextTokenizer.extractTokens(kw);
        if (kwTokens.isEmpty()) {
            return Collections.emptyMap();
        }

        List<String> matchedTags = new ArrayList<>();
        for (String tag : ix.tagDictionary()) {
            List<String> tagTokens = TextTokenizer.extractTokens(tag);
            if (tagTokens.isEmpty()) continue;
            if (Collections.indexOfSubList(kwTokens, tagTokens) != -1
                    || Collections.indexOfSubList(tagTokens, kwTokens) != -1) {
                matchedTags.add(tag);
            }
        }

        if (matchedTags.isEmpty()) {
            return Collections.emptyMap();
        }

        double norm = Math.sqrt(matchedTags.size());
        double w = 1.0 / norm;
        Map<String, Double> result = new HashMap<>(matchedTags.size());
        for (String t : matchedTags) {
            result.put(t, w);
        }
        return result;
    }

    private static Map<String, Double> buildSearchTextVector(String kw, LutVectorIndex ix, Set<String> stopwords) {
        if (kw == null || kw.isBlank()) {
            return Collections.emptyMap();
        }
        TextTokenizer.TokenResult tr = TextTokenizer.tokenize(kw, "", stopwords);
        Map<String, Double> weighted = new HashMap<>();
        double sumSq = 0.0;

        for (Map.Entry<String, Integer> entry : tr.getAllTerms().entrySet()) {
            String term = entry.getKey();
            int count = entry.getValue();
            double idf = ix.textIdf(term);
            if (idf > 0.0) {
                double w = (1.0 + Math.log(count)) * idf;
                weighted.put(term, w);
                sumSq += w * w;
            }
        }

        if (weighted.isEmpty() || sumSq <= 0.0) {
            return Collections.emptyMap();
        }

        double norm = Math.sqrt(sumSq);
        Map<String, Double> result = new HashMap<>(weighted.size());
        for (Map.Entry<String, Double> entry : weighted.entrySet()) {
            result.put(entry.getKey(), entry.getValue() / norm);
        }
        return result;
    }

    public static double round4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }

    public static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private record SignalCandidate(UserSignal signal, String type, Map<String, Double> searchTag, Map<String, Double> searchText) {}
    private record EvaluatedPair(SignalCandidate candidate, double c) {}
}
