package vn.aeoc.business.lut.constant;
public enum LutSort {
    RELEVANCE,
    NEWEST,
    POPULAR;

    public static LutSort parse(String value) {
        if (value == null) {
            return RELEVANCE;
        }
        try {
            return valueOf(value.toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return RELEVANCE;
        }
    }
}
