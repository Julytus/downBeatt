package vn.aeoc.business.lut.seed;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferInt;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;
import java.util.Locale;

public class SeedImageRenderer {

    private static final float JPEG_QUALITY = 0.85f;

    public BufferedImage renderBefore(InputStream photo) throws IOException {
        BufferedImage src = ImageIO.read(photo);
        if (src == null) {
            throw new IOException("Không đọc được ảnh gốc");
        }
        BufferedImage before = new BufferedImage(1280, 720, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = before.createGraphics();
        try {
            g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2.drawImage(src, 0, 0, 1280, 720, null);
        } finally {
            g2.dispose();
        }
        return before;
    }

    public BufferedImage renderAfter(BufferedImage before, double[][][][] grid) {
        BufferedImage after = new BufferedImage(1280, 720, BufferedImage.TYPE_INT_RGB);
        int width = 1280;
        int height = 720;

        if (before.getType() == BufferedImage.TYPE_INT_RGB) {
            int[] srcPixels = ((DataBufferInt) before.getRaster().getDataBuffer()).getData();
            int[] dstPixels = ((DataBufferInt) after.getRaster().getDataBuffer()).getData();
            int total = width * height;
            for (int i = 0; i < total; i++) {
                int rgb = srcPixels[i];
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                dstPixels[i] = interpolatePixel(r, g, b, grid);
            }
        } else {
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int rgb = before.getRGB(x, y);
                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;
                    after.setRGB(x, y, interpolatePixel(r, g, b, grid));
                }
            }
        }
        return after;
    }

    private int interpolatePixel(int r, int g, int b, double[][][][] grid) {
        double cr = (r / 255.0) * 32.0;
        double cg = (g / 255.0) * 32.0;
        double cb = (b / 255.0) * 32.0;

        int loR = (int) cr;
        int hiR = Math.min(loR + 1, 32);
        int loG = (int) cg;
        int hiG = Math.min(loG + 1, 32);
        int loB = (int) cb;
        int hiB = Math.min(loB + 1, 32);

        double fracR = cr - loR;
        double fracG = cg - loG;
        double fracB = cb - loB;

        double outR = 0.0;
        double outG = 0.0;
        double outB = 0.0;

        for (int rb = 0; rb <= 1; rb++) {
            int ri = (rb == 1) ? hiR : loR;
            double wr = (rb == 1) ? fracR : (1.0 - fracR);
            for (int gb = 0; gb <= 1; gb++) {
                int gi = (gb == 1) ? hiG : loG;
                double wg = (gb == 1) ? fracG : (1.0 - fracG);
                for (int bb = 0; bb <= 1; bb++) {
                    int bi = (bb == 1) ? hiB : loB;
                    double wb = (bb == 1) ? fracB : (1.0 - fracB);
                    double w = wr * wg * wb;
                    outR += grid[bi][gi][ri][0] * w;
                    outG += grid[bi][gi][ri][1] * w;
                    outB += grid[bi][gi][ri][2] * w;
                }
            }
        }

        int outRInt = (int) Math.round(clamp(outR) * 255.0);
        int outGInt = (int) Math.round(clamp(outG) * 255.0);
        int outBInt = (int) Math.round(clamp(outB) * 255.0);

        return (outRInt << 16) | (outGInt << 8) | outBInt;
    }

    private static double clamp(double v) {
        if (v < 0.0) return 0.0;
        if (v > 1.0) return 1.0;
        return v;
    }

    public byte[] coverFromAfter(BufferedImage afterImage, String text, String style) throws IOException {
        BufferedImage cover = new BufferedImage(960, 540, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = cover.createGraphics();
        try {
            g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2.drawImage(afterImage, 0, 0, 960, 540, null);

            if (text != null && !text.isBlank()) {
                g2.setColor(new Color(0, 0, 0, (int) Math.round(255 * 0.40)));
                g2.fillRect(0, 430, 960, 110);

                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
                Font font = new Font(Font.SANS_SERIF, Font.BOLD, 36);
                g2.setFont(font);

                Color textColor = "bold".equalsIgnoreCase(style) ? new Color(245, 197, 66) : Color.WHITE;
                g2.setColor(textColor);
                g2.drawString(text.toUpperCase(Locale.ROOT), 40, 500);
            }
        } finally {
            g2.dispose();
        }
        return toJpeg(cover);
    }

    public byte[] before(InputStream photo) throws IOException {
        BufferedImage before = renderBefore(photo);
        return toJpeg(before);
    }

    public byte[] after(InputStream photo, double[][][][] grid) throws IOException {
        BufferedImage before = renderBefore(photo);
        BufferedImage after = renderAfter(before, grid);
        return toJpeg(after);
    }

    public byte[] cover(InputStream photo, double[][][][] grid, String text, String style) throws IOException {
        BufferedImage before = renderBefore(photo);
        BufferedImage after = renderAfter(before, grid);
        return coverFromAfter(after, text, style);
    }

    public byte[] toJpeg(BufferedImage image) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IllegalStateException("Không tìm thấy JPEG ImageWriter");
        }
        ImageWriter writer = writers.next();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            writer.setOutput(ios);
            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(JPEG_QUALITY);
            }
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        return baos.toByteArray();
    }
}
