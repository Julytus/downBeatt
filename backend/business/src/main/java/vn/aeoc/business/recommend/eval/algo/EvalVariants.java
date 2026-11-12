package vn.aeoc.business.recommend.eval.algo;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.eval.tune.TuningResult;

public class EvalVariants {

    public record VariantConfig(RecommendProperties props, boolean useDeclared) {}

    public static VariantConfig props(String code, TuningResult T, TuningResult T3, RecommendProperties D) {
        RecommendProperties p = CbfTagAlgorithm.copyProperties(D);
        boolean useDeclared = true;

        RecommendProperties.Weights Tw = (T != null && T.getWeights() != null)
                ? T.getWeights()
                : D.normalizedWeights();
        double ThalfLife = (T != null) ? T.getHalfLifeDays() : D.getHalfLifeDays();
        double TcoldK = (T != null) ? T.getColdStartK() : D.getColdStartK();
        double Tlambda = (T != null) ? T.getMmrLambda() : D.getMmrLambda();

        double T3halfLife = (T3 != null) ? T3.getHalfLifeDays() : D.getHalfLifeDays();
        double T3coldK = (T3 != null) ? T3.getColdStartK() : D.getColdStartK();
        double T3lambda = (T3 != null) ? T3.getMmrLambda() : D.getMmrLambda();

        switch (code) {
            case "cbf-tag" -> {
                p.setWeights(new RecommendProperties.Weights(1.0, 0.0, 0.0, 0.0, 0.0, 0.0));
                p.setHalfLifeDays(T3halfLife);
                p.setColdStartK(T3coldK);
                p.setMmrLambda(T3lambda);
            }
            case "cbf-full" -> {
                p.setWeights(new RecommendProperties.Weights(
                        Tw.getTag(), Tw.getColor(), Tw.getCategory(),
                        Tw.getStyle(), Tw.getText(), Tw.getCreator()
                ));
                p.setHalfLifeDays(ThalfLife);
                p.setColdStartK(TcoldK);
                p.setMmrLambda(Tlambda);
            }
            case "m-mau" -> {
                double tag = Tw.getTag();
                double cat = Tw.getCategory();
                double style = Tw.getStyle();
                double text = Tw.getText();
                double creator = Tw.getCreator();
                double sum = tag + cat + style + text + creator;
                if (sum <= 1e-12) {
                    p.setWeights(new RecommendProperties.Weights(0.2, 0.0, 0.2, 0.2, 0.2, 0.2));
                } else {
                    p.setWeights(new RecommendProperties.Weights(
                            tag / sum, 0.0, cat / sum, style / sum, text / sum, creator / sum
                    ));
                }
                p.setHalfLifeDays(ThalfLife);
                p.setColdStartK(TcoldK);
                p.setMmrLambda(Tlambda);
            }
            case "m-the" -> {
                double color = Tw.getColor();
                double cat = Tw.getCategory();
                double style = Tw.getStyle();
                double text = Tw.getText();
                double creator = Tw.getCreator();
                double sum = color + cat + style + text + creator;
                if (sum <= 1e-12) {
                    p.setWeights(new RecommendProperties.Weights(0.0, 0.2, 0.2, 0.2, 0.2, 0.2));
                } else {
                    p.setWeights(new RecommendProperties.Weights(
                            0.0, color / sum, cat / sum, style / sum, text / sum, creator / sum
                    ));
                }
                p.setHalfLifeDays(ThalfLife);
                p.setColdStartK(TcoldK);
                p.setMmrLambda(Tlambda);
            }
            case "m-giam" -> {
                p.setWeights(new RecommendProperties.Weights(
                        Tw.getTag(), Tw.getColor(), Tw.getCategory(),
                        Tw.getStyle(), Tw.getText(), Tw.getCreator()
                ));
                p.setHalfLifeDays(0.0);
                p.setColdStartK(TcoldK);
                p.setMmrLambda(Tlambda);
            }
            case "m-mmr" -> {
                p.setWeights(new RecommendProperties.Weights(
                        Tw.getTag(), Tw.getColor(), Tw.getCategory(),
                        Tw.getStyle(), Tw.getText(), Tw.getCreator()
                ));
                p.setHalfLifeDays(ThalfLife);
                p.setColdStartK(TcoldK);
                p.setMmrLambda(1.0);
            }
            case "m-kb" -> {
                p.setWeights(new RecommendProperties.Weights(
                        Tw.getTag(), Tw.getColor(), Tw.getCategory(),
                        Tw.getStyle(), Tw.getText(), Tw.getCreator()
                ));
                p.setHalfLifeDays(ThalfLife);
                p.setColdStartK(TcoldK);
                p.setMmrLambda(Tlambda);
                useDeclared = false;
            }
            case "m-tron" -> {
                p.setWeights(new RecommendProperties.Weights(
                        Tw.getTag(), Tw.getColor(), Tw.getCategory(),
                        Tw.getStyle(), Tw.getText(), Tw.getCreator()
                ));
                p.setHalfLifeDays(ThalfLife);
                p.setColdStartK(TcoldK);
                p.setMmrLambda(Tlambda);
                p.setEvent(new RecommendProperties.EventWeights(
                        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0
                ));
            }
            case "m-mac-dinh" -> {
                // Toàn bộ D, useDeclared = true
            }
            default -> {
                // Giữ nguyên copy của D
            }
        }

        return new VariantConfig(p, useDeclared);
    }
}
