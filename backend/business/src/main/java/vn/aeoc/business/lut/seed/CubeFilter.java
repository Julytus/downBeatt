package vn.aeoc.business.lut.seed;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CubeFilter {

    private static final Pattern OP_PATTERN = Pattern.compile(
            "(grayscale|sepia|saturate|hue-rotate|brightness|contrast)\\(([^)]+)\\)"
    );

    public record Op(String name, double value) {
        public String getName() {
            return name;
        }

        public double getValue() {
            return value;
        }
    }

    private CubeFilter() {}

    public static List<Op> parse(String filter) {
        if (filter == null || filter.isBlank()) {
            return Collections.emptyList();
        }
        List<Op> ops = new ArrayList<>();
        Matcher matcher = OP_PATTERN.matcher(filter);
        while (matcher.find()) {
            String name = matcher.group(1);
            String rawArg = matcher.group(2).trim();
            double v = Double.parseDouble(rawArg.replace("deg", "").replace("turn", "").trim());
            if ("hue-rotate".equals(name) && rawArg.contains("turn")) {
                v *= 360.0;
            }
            ops.add(new Op(name, v));
        }
        return Collections.unmodifiableList(ops);
    }

    public static double[] apply(double r, double g, double b, List<Op> ops) {
        double cr = r;
        double cg = g;
        double cb = b;

        if (ops == null || ops.isEmpty()) {
            return new double[]{cr, cg, cb};
        }

        for (Op op : ops) {
            String name = op.name();
            double v = op.value();
            switch (name) {
                case "grayscale" -> {
                    double a = v;
                    double r0 = (1.0 - a) + a * 0.2126;
                    double r1 = a * 0.7152;
                    double r2 = a * 0.0722;

                    double g0 = a * 0.2126;
                    double g1 = (1.0 - a) + a * 0.7152;
                    double g2 = a * 0.0722;

                    double b0 = a * 0.2126;
                    double b1 = a * 0.7152;
                    double b2 = (1.0 - a) + a * 0.0722;

                    double nextR = clamp(cr * r0 + cg * r1 + cb * r2);
                    double nextG = clamp(cr * g0 + cg * g1 + cb * g2);
                    double nextB = clamp(cr * b0 + cg * b1 + cb * b2);

                    cr = nextR;
                    cg = nextG;
                    cb = nextB;
                }
                case "sepia" -> {
                    double a = v;
                    double r0 = (1.0 - a) + a * 0.393;
                    double r1 = a * 0.769;
                    double r2 = a * 0.189;

                    double g0 = a * 0.349;
                    double g1 = (1.0 - a) + a * 0.686;
                    double g2 = a * 0.168;

                    double b0 = a * 0.272;
                    double b1 = a * 0.534;
                    double b2 = (1.0 - a) + a * 0.131;

                    double nextR = clamp(cr * r0 + cg * r1 + cb * r2);
                    double nextG = clamp(cr * g0 + cg * g1 + cb * g2);
                    double nextB = clamp(cr * b0 + cg * b1 + cb * b2);

                    cr = nextR;
                    cg = nextG;
                    cb = nextB;
                }
                case "saturate" -> {
                    double r0 = 0.213 + 0.787 * v;
                    double r1 = 0.715 - 0.715 * v;
                    double r2 = 0.072 - 0.072 * v;

                    double g0 = 0.213 - 0.213 * v;
                    double g1 = 0.715 + 0.285 * v;
                    double g2 = 0.072 - 0.072 * v;

                    double b0 = 0.213 - 0.213 * v;
                    double b1 = 0.715 - 0.715 * v;
                    double b2 = 0.072 + 0.928 * v;

                    double nextR = clamp(cr * r0 + cg * r1 + cb * r2);
                    double nextG = clamp(cr * g0 + cg * g1 + cb * g2);
                    double nextB = clamp(cr * b0 + cg * b1 + cb * b2);

                    cr = nextR;
                    cg = nextG;
                    cb = nextB;
                }
                case "hue-rotate" -> {
                    double a = Math.toRadians(v);
                    double c = Math.cos(a);
                    double s = Math.sin(a);

                    double r0 = 0.213 + c * 0.787 - s * 0.213;
                    double r1 = 0.715 - c * 0.715 - s * 0.715;
                    double r2 = 0.072 - c * 0.072 + s * 0.928;

                    double g0 = 0.213 - c * 0.213 + s * 0.143;
                    double g1 = 0.715 + c * 0.285 + s * 0.140;
                    double g2 = 0.072 - c * 0.072 - s * 0.283;

                    double b0 = 0.213 - c * 0.213 - s * 0.787;
                    double b1 = 0.715 - c * 0.715 + s * 0.715;
                    double b2 = 0.072 + c * 0.928 + s * 0.072;

                    double nextR = clamp(cr * r0 + cg * r1 + cb * r2);
                    double nextG = clamp(cr * g0 + cg * g1 + cb * g2);
                    double nextB = clamp(cr * b0 + cg * b1 + cb * b2);

                    cr = nextR;
                    cg = nextG;
                    cb = nextB;
                }
                case "brightness" -> {
                    cr = clamp(cr * v);
                    cg = clamp(cg * v);
                    cb = clamp(cb * v);
                }
                case "contrast" -> {
                    cr = clamp((cr - 0.5) * v + 0.5);
                    cg = clamp((cg - 0.5) * v + 0.5);
                    cb = clamp((cb - 0.5) * v + 0.5);
                }
                default -> {}
            }
        }

        return new double[]{cr, cg, cb};
    }

    public static double[][][][] grid(String filter) {
        List<Op> ops = parse(filter);
        double[][][][] g = new double[33][33][33][3];
        for (int b = 0; b < 33; b++) {
            double inB = b / 32.0;
            for (int gIdx = 0; gIdx < 33; gIdx++) {
                double inG = gIdx / 32.0;
                for (int r = 0; r < 33; r++) {
                    double inR = r / 32.0;
                    double[] out = apply(inR, inG, inB, ops);
                    g[b][gIdx][r][0] = out[0];
                    g[b][gIdx][r][1] = out[1];
                    g[b][gIdx][r][2] = out[2];
                }
            }
        }
        return g;
    }

    public static byte[] writeCube(String title, String filter) {
        String sanitizedTitle = title == null ? "" : title.replace("\"", "'");
        double[][][][] g = grid(filter);
        StringBuilder sb = new StringBuilder(970350);
        sb.append("TITLE \"").append(sanitizedTitle).append("\"\n");
        sb.append("LUT_3D_SIZE 33\n");
        for (int b = 0; b < 33; b++) {
            for (int gIdx = 0; gIdx < 33; gIdx++) {
                for (int r = 0; r < 33; r++) {
                    sb.append(String.format(Locale.ROOT, "%.6f %.6f %.6f\n",
                            g[b][gIdx][r][0], g[b][gIdx][r][1], g[b][gIdx][r][2]));
                }
            }
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static double clamp(double v) {
        if (v < 0.0) return 0.0;
        if (v > 1.0) return 1.0;
        return v;
    }
}
