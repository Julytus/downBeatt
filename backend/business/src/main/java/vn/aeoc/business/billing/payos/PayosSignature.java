package vn.aeoc.business.billing.payos;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Component
public class PayosSignature {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public static String signCreate(long amount, String cancelUrl, String description, long orderCode, String returnUrl, String checksumKey) {
        String raw = "amount=" + amount
                + "&cancelUrl=" + (cancelUrl != null ? cancelUrl : "")
                + "&description=" + (description != null ? description : "")
                + "&orderCode=" + orderCode
                + "&returnUrl=" + (returnUrl != null ? returnUrl : "");
        return hmacSha256(raw, checksumKey);
    }

    public static String signData(JsonNode data, String checksumKey) {
        if (data == null || !data.isObject()) {
            return "";
        }
        List<String> keys = new ArrayList<>();
        data.fieldNames().forEachRemaining(keys::add);
        Collections.sort(keys);

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < keys.size(); i++) {
            if (i > 0) {
                sb.append("&");
            }
            String key = keys.get(i);
            sb.append(key).append("=").append(signValue(data.get(key)));
        }
        return hmacSha256(sb.toString(), checksumKey);
    }

    public static String signData(Map<String, Object> data, String checksumKey) {
        JsonNode node = OBJECT_MAPPER.valueToTree(data);
        return signData(node, checksumKey);
    }

    public static boolean verify(JsonNode data, String signature, String checksumKey) {
        if (signature == null || signature.isBlank() || data == null || !data.isObject() || checksumKey == null || checksumKey.isBlank()) {
            return false;
        }
        String expected = signData(data, checksumKey);
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8));
    }

    public static String signValue(JsonNode v) {
        if (v == null || v.isNull() || v.isMissingNode()) {
            return "";
        }
        if (v.isTextual()) {
            String text = v.asText();
            if ("null".equals(text) || "undefined".equals(text)) {
                return "";
            }
            return text;
        }
        if (v.isValueNode()) {
            return v.asText();
        }
        if (v.isObject() || v.isArray()) {
            JsonNode sorted = sortDeep(v);
            try {
                return OBJECT_MAPPER.writeValueAsString(sorted);
            } catch (Exception e) {
                return "";
            }
        }
        return v.asText();
    }

    public static JsonNode sortDeep(JsonNode node) {
        if (node == null) {
            return null;
        }
        if (node.isObject()) {
            List<String> fieldNames = new ArrayList<>();
            node.fieldNames().forEachRemaining(fieldNames::add);
            Collections.sort(fieldNames);
            ObjectNode sorted = OBJECT_MAPPER.createObjectNode();
            for (String fieldName : fieldNames) {
                sorted.set(fieldName, sortDeep(node.get(fieldName)));
            }
            return sorted;
        }
        if (node.isArray()) {
            ArrayNode sortedArray = OBJECT_MAPPER.createArrayNode();
            for (JsonNode item : node) {
                sortedArray.add(sortDeep(item));
            }
            return sortedArray;
        }
        return node;
    }

    public static String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("HMAC_SHA256 error", e);
        }
    }
}
