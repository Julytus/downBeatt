package vn.aeoc.business.recommend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.recommend.profile.UserProfile;
import vn.aeoc.business.recommend.service.EventService;
import vn.aeoc.business.recommend.service.RecommendService;
import vn.aeoc.business.recommend.service.UserProfileService;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.recommend.RecImpression;
import vn.aeoc.entity.data.mysql.recommend.RecommendResult;
import vn.aeoc.entity.data.mysql.recommend.RecommendProfile;
import vn.aeoc.entity.data.mysql.recommend.UserEvent;

import java.security.Principal;

@RestController
public class RecommendController extends BaseController {

    private final EventService eventService;
    private final UserProfileService userProfileService;
    private final RecommendService recommendService;

    public RecommendController(EventService eventService,
                               UserProfileService userProfileService,
                               RecommendService recommendService,
                               UserService userService) {
        super(userService);
        this.eventService = eventService;
        this.userProfileService = userProfileService;
        this.recommendService = recommendService;
    }

    @PostMapping("/recommend/public/for-you")
    public ResponseEntity<ApiResponse<RecommendResult>> forYou(
            @RequestBody(required = false) RecImpression request,
            Principal principal) {
        Integer uid = SecurityUtils.userId(principal);
        Integer userId = (uid != null && uid > 0) ? uid : null;
        RecommendResult result = recommendService.forYou(userId, request);
        return Mapper.map(result, ApiResponse::okEntity);
    }

    @PostMapping("/recommend/dismiss")
    public ResponseEntity<ApiResponse<Boolean>> dismiss(
            @RequestBody UserEvent request,
            Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        boolean result = eventService.dismiss(userId, request);
        return Mapper.map(result, ApiResponse::okEntity);
    }

    @GetMapping("/lut/public/related")
    public ResponseEntity<ApiResponse<Page<Lut>>> related(
            @RequestParam String slug,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String anonId,
            Principal principal) {
        Integer uid = SecurityUtils.userId(principal);
        Integer userId = (uid != null && uid > 0) ? uid : null;
        Page<Lut> result = recommendService.related(userId, anonId, slug, page, limit);
        return Mapper.map(result, ApiResponse::okEntity);
    }

    @PostMapping("/recommend/public/event")
    public ResponseEntity<ApiResponse<Boolean>> recordEvent(@RequestBody(required = false) UserEvent request,
                                                            Principal principal) {
        Integer uid = SecurityUtils.userId(principal);
        Integer userId = (uid != null && uid > 0) ? uid : null;
        boolean result = eventService.record(userId, request);
        return Mapper.map(result, ApiResponse::okEntity);
    }

    @PostMapping("/recommend/public/profile")
    public ResponseEntity<ApiResponse<RecommendProfile>> getProfile(@RequestBody(required = false) UserEvent request,
                                                                    Principal principal) {
        Integer uid = SecurityUtils.userId(principal);
        Integer userId = (uid != null && uid > 0) ? uid : null;
        String anonId = request != null ? request.getAnonId() : null;
        UserProfile profile = userProfileService.profileOf(userId, anonId);
        RecommendProfile summary = userProfileService.summary(profile);
        return Mapper.map(summary, ApiResponse::okEntity);
    }

    @PostMapping("/recommend/merge-anon")
    public ResponseEntity<ApiResponse<Integer>> mergeAnon(@RequestBody(required = false) UserEvent request,
                                                          Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        String anonId = request != null ? request.getAnonId() : null;
        int result = eventService.mergeAnon(userId, anonId);
        return Mapper.map(result, ApiResponse::okEntity);
    }

    @PostMapping("/recommend/clear-history")
    public ResponseEntity<ApiResponse<Integer>> clearHistory(@RequestBody(required = false) UserEvent request,
                                                             Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        String anonId = request != null ? request.getAnonId() : null;
        int result = eventService.clearHistory(userId, anonId);
        return Mapper.map(result, ApiResponse::okEntity);
    }
}
