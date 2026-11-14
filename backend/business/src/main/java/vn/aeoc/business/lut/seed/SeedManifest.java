package vn.aeoc.business.lut.seed;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SeedManifest {
    private Integer id;
    private String slug;
    private String title;
    private String filter;
    private String picsumSeed;
    private String videoSource;
    private String coverText;
    private String coverTextStyle;

    private List<SeedManifest> luts;
}
