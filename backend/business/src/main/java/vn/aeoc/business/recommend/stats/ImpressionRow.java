package vn.aeoc.business.recommend.stats;

import java.util.List;

public record ImpressionRow(long id, String variant, String strategy, List<Integer> lutIds) {
}
