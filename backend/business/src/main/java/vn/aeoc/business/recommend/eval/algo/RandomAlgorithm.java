package vn.aeoc.business.recommend.eval.algo;

import vn.aeoc.business.recommend.eval.sim.UserSimulator;
import vn.aeoc.business.recommend.eval.split.EvalCase;
import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.util.*;

public class RandomAlgorithm implements EvalAlgorithm {

    private final long seed;
    private final int repeat;

    public RandomAlgorithm() {
        this(42L, 0);
    }

    public RandomAlgorithm(long seed, int repeat) {
        this.seed = seed;
        this.repeat = repeat;
    }

    @Override
    public String code() {
        return "random";
    }

    @Override
    public List<Integer> rank(EvalCase c, int k) {
        return rank(c, k, this.repeat, this.seed);
    }

    public List<Integer> rank(EvalCase c, int k, int rep, long runSeed) {
        if (c == null || c.candidates() == null || k <= 0) {
            return List.of();
        }

        Set<Integer> excluded = getExcludedIds(c.signals());
        List<ItemVector> pool = new ArrayList<>();
        for (ItemVector iv : c.candidates()) {
            if (!excluded.contains(iv.id())) {
                pool.add(iv);
            }
        }

        if (pool.isEmpty()) {
            return List.of();
        }

        long pairSeed = UserSimulator.mix(runSeed, rep, c.userId());
        SplittableRandom rRng = new SplittableRandom(pairSeed);

        int take = Math.min(k, pool.size());
        for (int i = 0; i < take; i++) {
            int j = i + rRng.nextInt(pool.size() - i);
            ItemVector tmp = pool.get(i);
            pool.set(i, pool.get(j));
            pool.set(j, tmp);
        }

        List<Integer> result = new ArrayList<>(take);
        for (int i = 0; i < take; i++) {
            result.add(pool.get(i).id());
        }
        return result;
    }

    public static Set<Integer> getExcludedIds(List<UserSignal> signals) {
        if (signals == null || signals.isEmpty()) {
            return Collections.emptySet();
        }
        Set<Integer> set = new HashSet<>();
        for (UserSignal s : signals) {
            if (s.getLutId() != null && s.getType() != null) {
                String t = s.getType().toUpperCase(Locale.ROOT);
                if ("DOWNLOAD".equals(t) || "DISMISS".equals(t)) {
                    set.add(s.getLutId());
                }
            }
        }
        return set;
    }
}
