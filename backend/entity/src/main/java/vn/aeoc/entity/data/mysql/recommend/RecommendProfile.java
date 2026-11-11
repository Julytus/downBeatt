package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecommendProfile {
    private String strategy;
    private Double alpha;
    private Integer positiveLutCount;

    @Builder.Default
    private List<String> preference = new ArrayList<>();

    @Builder.Default
    private List<ProfileTerm> topStyles = new ArrayList<>();

    @Builder.Default
    private List<ProfileTerm> topCategories = new ArrayList<>();

    @Builder.Default
    private List<ProfileTerm> topTags = new ArrayList<>();

    @Builder.Default
    private List<UserSignal> signals = new ArrayList<>();

    public static RecommendProfile empty() {
        return RecommendProfile.builder()
                .strategy("POPULAR")
                .alpha(0.0)
                .positiveLutCount(0)
                .preference(List.of())
                .topStyles(List.of())
                .topCategories(List.of())
                .topTags(List.of())
                .signals(List.of())
                .build();
    }
}
