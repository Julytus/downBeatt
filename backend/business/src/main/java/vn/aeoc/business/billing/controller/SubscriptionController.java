package vn.aeoc.business.billing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.billing.service.SubscriptionService;
import vn.aeoc.entity.data.mysql.billing.Subscription;

import java.security.Principal;

@RestController
public class SubscriptionController extends BaseController {
    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService, UserService userService) {
        super(userService);
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/subscription/my")
    public ResponseEntity<ApiResponse<Subscription>> my(Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(subscriptionService.my(userId), ApiResponse::okEntity);
    }

    @PostMapping("/subscription/cancel")
    public ResponseEntity<ApiResponse<Subscription>> cancel(Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(subscriptionService.cancel(userId), ApiResponse::okEntity);
    }
}
