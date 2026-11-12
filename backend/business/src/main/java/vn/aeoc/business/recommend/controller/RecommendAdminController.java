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
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.recommend.service.RecEvalRunService;
import vn.aeoc.business.recommend.service.RecommendAdminService;
import vn.aeoc.business.recommend.service.RecommendService;
import vn.aeoc.business.recommend.service.RecommendStatsService;
import vn.aeoc.entity.data.mysql.recommend.CustomerOption;
import vn.aeoc.entity.data.mysql.recommend.RebuildResult;
import vn.aeoc.entity.data.mysql.recommend.RecEvalRun;
import vn.aeoc.entity.data.mysql.recommend.RecommendConfig;
import vn.aeoc.entity.data.mysql.recommend.RecommendStats;
import vn.aeoc.entity.data.mysql.recommend.TryProfileRequest;
import vn.aeoc.entity.data.mysql.recommend.TryProfileResult;

import java.security.Principal;
import java.util.List;

@RestController
public class RecommendAdminController extends BaseController {

    private static final String URI = "/recommend/";

    private final RecommendAdminService recommendAdminService;
    private final RecommendStatsService recommendStatsService;
    private final RecommendService recommendService;
    private final RecEvalRunService recEvalRunService;

    public RecommendAdminController(RecommendAdminService recommendAdminService,
                                    RecommendStatsService recommendStatsService,
                                    RecommendService recommendService,
                                    RecEvalRunService recEvalRunService,
                                    UserService userService) {
        super(userService);
        this.recommendAdminService = recommendAdminService;
        this.recommendStatsService = recommendStatsService;
        this.recommendService = recommendService;
        this.recEvalRunService = recEvalRunService;
    }

    @GetMapping("/recommend/config")
    public ResponseEntity<ApiResponse<RecommendConfig>> config(Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(recommendAdminService.config(), ApiResponse::okEntity);
    }

    @PostMapping("/recommend/rebuild")
    public ResponseEntity<ApiResponse<RebuildResult>> rebuild(Principal principal) {
        checkPermission(principal, URI, "UPDATE");
        return Mapper.map(recommendAdminService.rebuild(), ApiResponse::okEntity);
    }

    @GetMapping("/recommend/stats")
    public ResponseEntity<ApiResponse<RecommendStats>> stats(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            Principal principal
    ) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(recommendStatsService.stats(from, to), ApiResponse::okEntity);
    }

    @GetMapping("/recommend/customers")
    public ResponseEntity<ApiResponse<List<CustomerOption>>> customers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer limit,
            Principal principal
    ) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(recommendAdminService.customers(keyword, limit), ApiResponse::okEntity);
    }

    @PostMapping("/recommend/try-profile")
    public ResponseEntity<ApiResponse<TryProfileResult>> tryProfile(
            @RequestBody(required = false) TryProfileRequest request,
            Principal principal
    ) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(recommendService.tryProfile(request), ApiResponse::okEntity);
    }

    @GetMapping("/recommend/eval/list")
    public ResponseEntity<ApiResponse<Page<RecEvalRun>>> evalList(
            @RequestParam(required = false) String algorithm,
            @RequestParam(required = false) String batch,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            Principal principal
    ) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(recEvalRunService.list(algorithm, batch, page, limit), ApiResponse::okEntity);
    }

    @GetMapping("/recommend/eval/get")
    public ResponseEntity<ApiResponse<RecEvalRun>> evalGet(
            @RequestParam(required = false) Integer id,
            Principal principal
    ) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(recEvalRunService.get(id), ApiResponse::okEntity);
    }
}
