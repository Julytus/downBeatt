package vn.aeoc.business.lut.feature;

import vn.aeoc.entity.data.mysql.lut.LutColorFeature;

public class ColorFeatureExtractor {

    private static final int GRID_SIZE = 17;
    private static final int TOTAL_POINTS = GRID_SIZE * GRID_SIZE * GRID_SIZE; // 4913

    private ColorFeatureExtractor() {}

    private static record Lab(double L, double a, double b, double C) {}

    public static LutColorFeature extract(CubeLut lut) {
        int n = lut.size();
        int step = (n - 1) / (GRID_SIZE - 1);
        double[] data = lut.data();

        Lab[] inLabs = new Lab[TOTAL_POINTS];
        Lab[] outLabs = new Lab[TOTAL_POINTS];

        int pointIndex = 0;
        for (int bi = 0; bi < GRID_SIZE; bi++) {
            for (int gi = 0; gi < GRID_SIZE; gi++) {
                for (int ri = 0; ri < GRID_SIZE; ri++) {
                    double inR = ri / 16.0;
                    double inG = gi / 16.0;
                    double inB = bi / 16.0;

                    int rGrid = ri * step;
                    int gGrid = gi * step;
                    int bGrid = bi * step;
                    int lutIndex = rGrid + gGrid * n + bGrid * n * n;

                    double rawOutR = data[3 * lutIndex];
                    double rawOutG = data[3 * lutIndex + 1];
                    double rawOutB = data[3 * lutIndex + 2];

                    double outR = Math.max(0.0, Math.min(1.0, rawOutR));
                    double outG = Math.max(0.0, Math.min(1.0, rawOutG));
                    double outB = Math.max(0.0, Math.min(1.0, rawOutB));

                    inLabs[pointIndex] = rgbToLab(inR, inG, inB);
                    outLabs[pointIndex] = rgbToLab(outR, outG, outB);
                    pointIndex++;
                }
            }
        }

        // 1. brightness = mean(L_ra - L_vao) / 100
        double sumDiffL = 0.0;
        for (int i = 0; i < TOTAL_POINTS; i++) {
            sumDiffL += (outLabs[i].L - inLabs[i].L);
        }
        double brightness = (sumDiffL / TOTAL_POINTS) / 100.0;

        // 2. contrast = std(L_ra) / std(L_vao), population standard deviation (divide by n)
        double sumLin = 0.0, sumLout = 0.0;
        for (int i = 0; i < TOTAL_POINTS; i++) {
            sumLin += inLabs[i].L;
            sumLout += outLabs[i].L;
        }
        double meanLin = sumLin / TOTAL_POINTS;
        double meanLout = sumLout / TOTAL_POINTS;

        double varLin = 0.0, varLout = 0.0;
        for (int i = 0; i < TOTAL_POINTS; i++) {
            double dIn = inLabs[i].L - meanLin;
            varLin += dIn * dIn;
            double dOut = outLabs[i].L - meanLout;
            varLout += dOut * dOut;
        }
        double stdLin = Math.sqrt(varLin / TOTAL_POINTS);
        double stdLout = Math.sqrt(varLout / TOTAL_POINTS);
        double contrast = stdLin > 0.0 ? (stdLout / stdLin) : 1.0;

        // 3. saturation = mean(C_ra) / mean(C_vao), on points with C_vao > 10
        double sumCin = 0.0, sumCout = 0.0;
        int countSat = 0;
        for (int i = 0; i < TOTAL_POINTS; i++) {
            if (inLabs[i].C > 10.0) {
                sumCin += inLabs[i].C;
                sumCout += outLabs[i].C;
                countSat++;
            }
        }
        double saturation = (countSat > 0 && sumCin > 0.0) ? (sumCout / sumCin) : 0.0;

        // 4. warmth = mean(b_ra - b_vao)
        // 5. tint = mean(a_ra - a_vao)
        double sumDiffB = 0.0;
        double sumDiffA = 0.0;
        for (int i = 0; i < TOTAL_POINTS; i++) {
            sumDiffB += (outLabs[i].b - inLabs[i].b);
            sumDiffA += (outLabs[i].a - inLabs[i].a);
        }
        double warmth = sumDiffB / TOTAL_POINTS;
        double tint = sumDiffA / TOTAL_POINTS;

        // 6. shadow_a, shadow_b on points with L_vao < 30
        double sumShadowA = 0.0, sumShadowB = 0.0;
        int countShadow = 0;
        for (int i = 0; i < TOTAL_POINTS; i++) {
            if (inLabs[i].L < 30.0) {
                sumShadowA += (outLabs[i].a - inLabs[i].a);
                sumShadowB += (outLabs[i].b - inLabs[i].b);
                countShadow++;
            }
        }
        double shadowA = countShadow > 0 ? (sumShadowA / countShadow) : 0.0;
        double shadowB = countShadow > 0 ? (sumShadowB / countShadow) : 0.0;

        // 7. highlight_a, highlight_b on points with L_vao > 70
        double sumHighlightA = 0.0, sumHighlightB = 0.0;
        int countHighlight = 0;
        for (int i = 0; i < TOTAL_POINTS; i++) {
            if (inLabs[i].L > 70.0) {
                sumHighlightA += (outLabs[i].a - inLabs[i].a);
                sumHighlightB += (outLabs[i].b - inLabs[i].b);
                countHighlight++;
            }
        }
        double highlightA = countHighlight > 0 ? (sumHighlightA / countHighlight) : 0.0;
        double highlightB = countHighlight > 0 ? (sumHighlightB / countHighlight) : 0.0;

        // 8. is_mono = mean(C_ra) < 5 ? 1 : 0 (across all sample points)
        double sumCoutAll = 0.0;
        for (int i = 0; i < TOTAL_POINTS; i++) {
            sumCoutAll += outLabs[i].C;
        }
        double meanCoutAll = sumCoutAll / TOTAL_POINTS;
        int isMono = meanCoutAll < 5.0 ? 1 : 0;

        LutColorFeature feature = new LutColorFeature();
        feature.setBrightness(brightness);
        feature.setContrast(contrast);
        feature.setSaturation(saturation);
        feature.setWarmth(warmth);
        feature.setTint(tint);
        feature.setShadowA(shadowA);
        feature.setShadowB(shadowB);
        feature.setHighlightA(highlightA);
        feature.setHighlightB(highlightB);
        feature.setIsMono(isMono);

        return feature;
    }

    private static Lab rgbToLab(double r, double g, double b) {
        double rLin = toLinear(r);
        double gLin = toLinear(g);
        double bLin = toLinear(b);

        double x = 0.4124 * rLin + 0.3576 * gLin + 0.1805 * bLin;
        double y = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
        double z = 0.0193 * rLin + 0.1192 * gLin + 0.9505 * bLin;

        double fx = f(x / 0.95047);
        double fy = f(y / 1.0);
        double fz = f(z / 1.08883);

        double l = 116.0 * fy - 16.0;
        double a = 500.0 * (fx - fy);
        double bVal = 200.0 * (fy - fz);
        double c = Math.sqrt(a * a + bVal * bVal);

        return new Lab(l, a, bVal, c);
    }

    private static double toLinear(double c) {
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    private static double f(double t) {
        return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16.0 / 116.0;
    }
}
