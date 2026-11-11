package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TryProfileResult {
    private CustomerOption customer;
    private String anonId;
    private String strategy;
    private Boolean premiumLimited;
    private Integer premiumQuota;
    private RecommendProfile profile;
    private List<ColorTerm> color;
    private Map<String, String> categoryNames;
    private List<Lut> items;
}
