package vn.aeoc.business.recommend.eval.split;

import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

public record EvalCase(
        int userId,
        LocalDateTime t0,
        List<UserSignal> signals,
        List<String> declaredSlugs,
        List<ItemVector> candidates,
        Set<Integer> relevantIds,
        Map<Integer, Integer> relMap,
        Map<Integer, Integer> downloadCountsBeforeT0,
        Map<Integer, Integer> downloadCounts30DaysBeforeT0
) {}
