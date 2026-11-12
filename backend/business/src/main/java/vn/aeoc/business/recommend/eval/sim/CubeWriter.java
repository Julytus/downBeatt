package vn.aeoc.business.recommend.eval.sim;

import vn.aeoc.business.lut.feature.ColorFeatureExtractor;
import vn.aeoc.business.lut.feature.CubeLut;
import vn.aeoc.business.lut.feature.CubeParser;
import vn.aeoc.entity.data.mysql.lut.LutColorFeature;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public class CubeWriter {

    public static final int LUT_SIZE = 33;

    public record ColorParams(
            double br,
            double k,
            double s,
            double t,
            double m,
            double hueS,
            double strS,
            double hueH,
            double strH,
            boolean mono
    ) {}

    private record Tone(double r, double g, double b) {}

    public static byte[] writeCube(ColorParams p) {
        StringBuilder sb = new StringBuilder(35937 * 28 + 100);
        sb.append("TITLE \"eval\"\n");
        sb.append("LUT_3D_SIZE 33\n");

        Tone toneS = computeTone(p.hueS());
        Tone toneH = computeTone(p.hueH());

        for (int b = 0; b < LUT_SIZE; b++) {
            double inB = b / 32.0;
            for (int g = 0; g < LUT_SIZE; g++) {
                double inG = g / 32.0;
                for (int r = 0; r < LUT_SIZE; r++) {
                    double inR = r / 32.0;

                    // 1. Y = 0.2126r + 0.7152g + 0.0722b; nếu mono thì r = g = b = Y
                    double cr = inR;
                    double cg = inG;
                    double cb = inB;
                    double y = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb;
                    if (p.mono()) {
                        cr = y;
                        cg = y;
                        cb = y;
                    }

                    // 2. Bão hoà: c = Y + s * (c - Y)
                    cr = y + p.s() * (cr - y);
                    cg = y + p.s() * (cg - y);
                    cb = y + p.s() * (cb - y);

                    // 3. Tương phản: c = 0.5 + k * (c - 0.5)
                    cr = 0.5 + p.k() * (cr - 0.5);
                    cg = 0.5 + p.k() * (cg - 0.5);
                    cb = 0.5 + p.k() * (cb - 0.5);

                    // 4. Độ sáng: c = c + br
                    cr += p.br();
                    cg += p.br();
                    cb += p.br();

                    // 5. Nhiệt độ / tint: r += 0.08*t, b -= 0.08*t; g -= 0.06*m
                    cr += 0.08 * p.t();
                    cb -= 0.08 * p.t();
                    cg -= 0.06 * p.m();

                    // 6. Tách tông: Y' = luma màu hiện tại, ws = (1 - Y')^2, wh = Y'^2
                    double yPrime = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb;
                    double ws = (1.0 - yPrime) * (1.0 - yPrime);
                    double wh = yPrime * yPrime;
                    cr += p.strS() * ws * toneS.r + p.strH() * wh * toneH.r;
                    cg += p.strS() * ws * toneS.g + p.strH() * wh * toneH.g;
                    cb += p.strS() * ws * toneS.b + p.strH() * wh * toneH.b;

                    // 7. Kẹp [0, 1]
                    cr = Math.max(0.0, Math.min(1.0, cr));
                    cg = Math.max(0.0, Math.min(1.0, cg));
                    cb = Math.max(0.0, Math.min(1.0, cb));

                    sb.append(String.format(Locale.US, "%.6f %.6f %.6f\n", cr, cg, cb));
                }
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public static LutColorFeature extract(ColorParams p) {
        byte[] bytes = writeCube(p);
        CubeLut cube = CubeParser.parse(new ByteArrayInputStream(bytes));
        return ColorFeatureExtractor.extract(cube);
    }

    private static Tone computeTone(double hue) {
        double h = hue % 360.0;
        if (h < 0) h += 360.0;
        double c = 1.0;
        double hPrime = h / 60.0;
        double x = c * (1.0 - Math.abs((hPrime % 2.0) - 1.0));
        double r1, g1, b1;
        if (hPrime < 1.0) {
            r1 = c; g1 = x; b1 = 0;
        } else if (hPrime < 2.0) {
            r1 = x; g1 = c; b1 = 0;
        } else if (hPrime < 3.0) {
            r1 = 0; g1 = c; b1 = x;
        } else if (hPrime < 4.0) {
            r1 = 0; g1 = x; b1 = c;
        } else if (hPrime < 5.0) {
            r1 = x; g1 = 0; b1 = c;
        } else {
            r1 = c; g1 = 0; b1 = x;
        }
        double mean = (r1 + g1 + b1) / 3.0;
        return new Tone(r1 - mean, g1 - mean, b1 - mean);
    }
}
