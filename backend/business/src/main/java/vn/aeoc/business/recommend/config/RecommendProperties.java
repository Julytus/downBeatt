package vn.aeoc.business.recommend.config;

import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "recommend")
public class RecommendProperties {
    private Weights weights = new Weights();
    private int similarityTop = 50;
    private boolean buildOnStartup = true;
    private String rebuildCron = "0 0 3 * * *";
    private List<List<String>> tagSynonyms = new ArrayList<>(List.of(
            List.of("đen trắng", "trắng đen", "b&w", "bw", "black and white"),
            List.of("vintage", "cổ điển", "retro"),
            List.of("phim", "film")
    ));
    private List<String> textStopwords = new ArrayList<>(List.of(
            "của", "và", "cho", "là", "những", "các", "với", "một", "được", "có", "này", "như", "rất", "khi"
    ));

    private EventWeights event = new EventWeights();
    private double halfLifeDays = 30.0;
    private int historyDays = 180;
    private int historyMaxPairs = 200;
    private double coldStartK = 5.0;
    private int eventDedupMinutes = 30;
    private int profileCacheMinutes = 5;
    private int preferenceMax = 12;
    private String eventCleanupCron = "0 30 0 * * *";

    @PostConstruct
    public void init() {
        normalizedWeights();
    }

    public Weights normalizedWeights() {
        if (weights == null) {
            throw new IllegalStateException("recommend.weights không hợp lệ");
        }
        double t = weights.getTag();
        double c = weights.getColor();
        double cat = weights.getCategory();
        double s = weights.getStyle();
        double txt = weights.getText();
        double cr = weights.getCreator();

        if (t < 0 || c < 0 || cat < 0 || s < 0 || txt < 0 || cr < 0) {
            throw new IllegalStateException("recommend.weights không hợp lệ");
        }
        double sum = t + c + cat + s + txt + cr;
        if (sum <= 0 || Double.isNaN(sum) || Double.isInfinite(sum)) {
            throw new IllegalStateException("recommend.weights không hợp lệ");
        }
        return new Weights(t / sum, c / sum, cat / sum, s / sum, txt / sum, cr / sum);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Weights {
        private double tag = 0.30;
        private double color = 0.25;
        private double category = 0.15;
        private double style = 0.15;
        private double text = 0.10;
        private double creator = 0.05;

        public double get(String key) {
            return switch (key) {
                case "tag" -> tag;
                case "color" -> color;
                case "category" -> category;
                case "style" -> style;
                case "text" -> text;
                case "creator" -> creator;
                default -> 0.0;
            };
        }

        public double sum() {
            return tag + color + category + style + text + creator;
        }

        public Map<String, Double> asMap() {
            return Map.of(
                    "tag", tag,
                    "color", color,
                    "category", category,
                    "style", style,
                    "text", text,
                    "creator", creator
            );
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventWeights {
        private double view = 1.0;
        private double preview = 2.0;
        private double search = 0.5;
        private double filterStyle = 0.5;
        private double favorite = 4.0;
        private double download = 5.0;
        private double purchase = 6.0;
        private double dismiss = -4.0;

        public double weightOf(String type) {
            if (type == null) return 0.0;
            return switch (type.toUpperCase()) {
                case "VIEW" -> view;
                case "PREVIEW" -> preview;
                case "SEARCH" -> search;
                case "FILTER_STYLE" -> filterStyle;
                case "FAVORITE" -> favorite;
                case "DOWNLOAD" -> download;
                case "PURCHASE" -> purchase;
                case "DISMISS" -> dismiss;
                default -> 0.0;
            };
        }
    }
}
