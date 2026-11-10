package vn.aeoc.business.lut.feature;

import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class CubeParser {

    private CubeParser() {}

    public static CubeLut parse(InputStream in) {
        if (in == null) {
            throw new AppException(ErrorCode.LUT_FILE_INVALID, "File .cube không hợp lệ: thiếu LUT_3D_SIZE");
        }

        Integer lut3dSize = null;
        double minR = 0.0, minG = 0.0, minB = 0.0;
        double maxR = 1.0, maxG = 1.0, maxB = 1.0;

        boolean inHeader = true;
        double[] data = null;
        int dataIndex = 0;
        int dataLinesCount = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String rawLine;
            int lineNumber = 0;
            boolean firstLine = true;

            while ((rawLine = reader.readLine()) != null) {
                lineNumber++;
                if (firstLine) {
                    if (rawLine.startsWith("\uFEFF")) {
                        rawLine = rawLine.substring(1);
                    }
                    firstLine = false;
                }

                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                String[] tokens = line.split("\\s+");
                if (tokens.length == 0 || tokens[0].isEmpty()) {
                    continue;
                }

                if (inHeader) {
                    if (tokens[0].equals("LUT_1D_SIZE")) {
                        throw new AppException(ErrorCode.LUT_FILE_INVALID,
                                "File .cube không hợp lệ: là LUT 1D, chỉ nhận LUT 3D");
                    } else if (tokens[0].equals("LUT_3D_SIZE")) {
                        if (tokens.length < 2) {
                            throw new AppException(ErrorCode.LUT_FILE_INVALID,
                                    "File .cube không hợp lệ: thiếu LUT_3D_SIZE");
                        }
                        int n;
                        try {
                            n = Integer.parseInt(tokens[1]);
                        } catch (NumberFormatException e) {
                            throw new AppException(ErrorCode.LUT_FILE_INVALID,
                                    "File .cube không hợp lệ: kích thước " + tokens[1] + " không được hỗ trợ (chỉ nhận 17, 33, 65)");
                        }
                        if (n != 17 && n != 33 && n != 65) {
                            throw new AppException(ErrorCode.LUT_FILE_INVALID,
                                    "File .cube không hợp lệ: kích thước " + n + " không được hỗ trợ (chỉ nhận 17, 33, 65)");
                        }
                        lut3dSize = n;
                        data = new double[3 * n * n * n];
                    } else if (tokens[0].equals("DOMAIN_MIN")) {
                        if (tokens.length >= 4) {
                            try {
                                minR = Double.parseDouble(tokens[1]);
                                minG = Double.parseDouble(tokens[2]);
                                minB = Double.parseDouble(tokens[3]);
                            } catch (NumberFormatException e) {
                                // ignore
                            }
                        }
                    } else if (tokens[0].equals("DOMAIN_MAX")) {
                        if (tokens.length >= 4) {
                            try {
                                maxR = Double.parseDouble(tokens[1]);
                                maxG = Double.parseDouble(tokens[2]);
                                maxB = Double.parseDouble(tokens[3]);
                            } catch (NumberFormatException e) {
                                // ignore
                            }
                        }
                    } else if (tokens[0].equals("LUT_3D_INPUT_RANGE")) {
                        if (tokens.length >= 3) {
                            try {
                                double min = Double.parseDouble(tokens[1]);
                                double max = Double.parseDouble(tokens[2]);
                                minR = min; minG = min; minB = min;
                                maxR = max; maxG = max; maxB = max;
                            } catch (NumberFormatException e) {
                                // ignore
                            }
                        }
                    } else if (isKeyword(tokens[0])) {
                        // Title or other keyword: ignore
                    } else {
                        // First data line reached!
                        inHeader = false;
                    }
                }

                if (!inHeader) {
                    if (lut3dSize == null) {
                        throw new AppException(ErrorCode.LUT_FILE_INVALID,
                                "File .cube không hợp lệ: thiếu LUT_3D_SIZE");
                    }
                    if (minR >= maxR || minG >= maxG || minB >= maxB) {
                        throw new AppException(ErrorCode.LUT_FILE_INVALID,
                                "File .cube không hợp lệ: DOMAIN_MIN phải nhỏ hơn DOMAIN_MAX");
                    }

                    if (tokens.length != 3) {
                        throw new AppException(ErrorCode.LUT_FILE_INVALID,
                                "File .cube không hợp lệ: dòng " + lineNumber + " không phải 3 số thực");
                    }

                    double rVal, gVal, bVal;
                    try {
                        rVal = Double.parseDouble(tokens[0]);
                        gVal = Double.parseDouble(tokens[1]);
                        bVal = Double.parseDouble(tokens[2]);
                    } catch (NumberFormatException e) {
                        throw new AppException(ErrorCode.LUT_FILE_INVALID,
                                "File .cube không hợp lệ: dòng " + lineNumber + " không phải 3 số thực");
                    }

                    if (Double.isNaN(rVal) || Double.isInfinite(rVal) ||
                            Double.isNaN(gVal) || Double.isInfinite(gVal) ||
                            Double.isNaN(bVal) || Double.isInfinite(bVal)) {
                        throw new AppException(ErrorCode.LUT_FILE_INVALID,
                                "File .cube không hợp lệ: dòng " + lineNumber + " không phải 3 số thực");
                    }

                    double scaledR = (rVal - minR) / (maxR - minR);
                    double scaledG = (gVal - minG) / (maxG - minG);
                    double scaledB = (bVal - minB) / (maxB - minB);

                    if (data != null && dataIndex + 2 < data.length) {
                        data[dataIndex] = scaledR;
                        data[dataIndex + 1] = scaledG;
                        data[dataIndex + 2] = scaledB;
                        dataIndex += 3;
                    }
                    dataLinesCount++;
                }
            }
        } catch (IOException e) {
            throw new AppException(ErrorCode.LUT_FILE_INVALID, "File .cube không hợp lệ: lỗi đọc file");
        }

        if (lut3dSize == null) {
            throw new AppException(ErrorCode.LUT_FILE_INVALID, "File .cube không hợp lệ: thiếu LUT_3D_SIZE");
        }
        if (minR >= maxR || minG >= maxG || minB >= maxB) {
            throw new AppException(ErrorCode.LUT_FILE_INVALID, "File .cube không hợp lệ: DOMAIN_MIN phải nhỏ hơn DOMAIN_MAX");
        }

        int requiredLines = lut3dSize * lut3dSize * lut3dSize;
        if (dataLinesCount != requiredLines) {
            throw new AppException(ErrorCode.LUT_FILE_INVALID,
                    "File .cube không hợp lệ: cần " + requiredLines + " dòng dữ liệu, file có " + dataLinesCount);
        }

        return new CubeLut(lut3dSize, data);
    }

    private static boolean isKeyword(String token) {
        return token.matches("^[A-Z][A-Z0-9_]*$");
    }
}
