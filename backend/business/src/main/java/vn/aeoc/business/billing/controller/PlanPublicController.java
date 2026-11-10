package vn.aeoc.business.billing.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.billing.service.PlanService;
import vn.aeoc.entity.data.mysql.billing.Plan;

import java.util.List;

@RestController
public class PlanPublicController extends BaseController {
    private final PlanService planService;

    public PlanPublicController(PlanService planService, UserService userService) {
        super(userService);
        this.planService = planService;
    }

    @GetMapping("/plan/public/list")
    public ResponseEntity<ApiResponse<List<Plan>>> list() {
        return Mapper.map(planService.listPublic(), ApiResponse::okEntity);
    }
}
