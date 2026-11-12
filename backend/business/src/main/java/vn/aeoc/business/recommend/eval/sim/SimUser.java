package vn.aeoc.business.recommend.eval.sim;

import java.util.List;

public record SimUser(
        int id,
        List<String> preferredStyles,
        List<String> declaredSlugs
) {}
