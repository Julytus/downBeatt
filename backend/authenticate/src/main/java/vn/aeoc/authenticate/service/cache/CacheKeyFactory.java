package vn.aeoc.authenticate.service.cache;

public final class CacheKeyFactory {

    private CacheKeyFactory() {
    }

    public static String authUser(Integer userId) {
        return "auth:user:" + userId;
    }

    public static String authRole(Integer roleId) {
        return "auth:role:" + roleId;
    }

    public static String authPermission(Integer roleId, String uri, String action) {
        return "auth:permission:role:" + roleId + ":uri:" + uri + ":action:" + action;
    }
}
