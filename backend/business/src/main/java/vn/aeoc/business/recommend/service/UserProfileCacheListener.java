package vn.aeoc.business.recommend.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import vn.aeoc.business.account.event.UserSignalChangedEvent;

@Component
public class UserProfileCacheListener {

    private final UserProfileService userProfileService;

    public UserProfileCacheListener(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onUserSignalChanged(UserSignalChangedEvent event) {
        if (event != null) {
            userProfileService.evict(event.userId(), event.anonId());
        }
    }
}
