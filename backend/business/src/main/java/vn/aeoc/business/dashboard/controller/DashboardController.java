package vn.aeoc.business.dashboard.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.dashboard.service.DashboardService;
import vn.aeoc.entity.data.mysql.dashboard.DashboardSummary;

import java.security.Principal;

@RestController
public class DashboardController extends BaseController {

    private static final String URI = "/dashboard/";

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService, UserService userService) {
        super(userService);
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<ApiResponse<DashboardSummary>> summary(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String groupBy,
            Principal principal
    ) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(dashboardService.summary(from, to, groupBy), ApiResponse::okEntity);
    }
}
