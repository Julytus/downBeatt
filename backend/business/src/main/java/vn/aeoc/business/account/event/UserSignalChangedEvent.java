package vn.aeoc.business.account.event;

public record UserSignalChangedEvent(Integer userId, String anonId, String reason) {
    public UserSignalChangedEvent(Integer userId, String reason) {
        this(userId, null, reason);
    }
}
