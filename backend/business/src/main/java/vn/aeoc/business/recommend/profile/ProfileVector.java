package vn.aeoc.business.recommend.profile;

import java.util.Arrays;
import java.util.Collections;
import java.util.Map;

public record ProfileVector(
        Map<String, Double> tag,
        Map<String, Double> category,
        Map<String, Double> style,
        Map<String, Double> text,
        Map<String, Double> creator,
        double[] color
) {
    public ProfileVector(Map<String, Double> tag,
                         Map<String, Double> category,
                         Map<String, Double> style,
                         Map<String, Double> text,
                         Map<String, Double> creator,
                         double[] color) {
        this.tag = tag != null ? Collections.unmodifiableMap(tag) : Collections.emptyMap();
        this.category = category != null ? Collections.unmodifiableMap(category) : Collections.emptyMap();
        this.style = style != null ? Collections.unmodifiableMap(style) : Collections.emptyMap();
        this.text = text != null ? Collections.unmodifiableMap(text) : Collections.emptyMap();
        this.creator = creator != null ? Collections.unmodifiableMap(creator) : Collections.emptyMap();
        this.color = color != null ? Arrays.copyOf(color, color.length) : null;
    }

    public static ProfileVector empty() {
        return new ProfileVector(Map.of(), Map.of(), Map.of(), Map.of(), Map.of(), null);
    }

    @Override
    public double[] color() {
        return color != null ? Arrays.copyOf(color, color.length) : null;
    }
}
