package vn.aeoc.business.recommend.profile;

import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.util.Collections;
import java.util.List;

public record UserProfile(
        String strategy,
        double alpha,
        int positiveLutCount,
        ProfileVector declared,
        ProfileVector behavior,
        ProfileVector mixed,
        List<UserSignal> signals,
        List<String> preferenceSlugs,
        LutVectorIndex index
) {
    public UserProfile(String strategy,
                       double alpha,
                       int positiveLutCount,
                       ProfileVector declared,
                       ProfileVector behavior,
                       ProfileVector mixed,
                       List<UserSignal> signals,
                       List<String> preferenceSlugs,
                       LutVectorIndex index) {
        this.strategy = strategy;
        this.alpha = alpha;
        this.positiveLutCount = positiveLutCount;
        this.declared = declared != null ? declared : ProfileVector.empty();
        this.behavior = behavior != null ? behavior : ProfileVector.empty();
        this.mixed = mixed != null ? mixed : ProfileVector.empty();
        this.signals = signals != null ? Collections.unmodifiableList(signals) : Collections.emptyList();
        this.preferenceSlugs = preferenceSlugs != null ? Collections.unmodifiableList(preferenceSlugs) : Collections.emptyList();
        this.index = index;
    }

    public static UserProfile empty() {
        return new UserProfile("POPULAR", 0.0, 0, ProfileVector.empty(), ProfileVector.empty(), ProfileVector.empty(), List.of(), List.of(), null);
    }
}
