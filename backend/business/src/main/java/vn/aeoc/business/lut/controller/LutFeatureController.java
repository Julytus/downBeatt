package vn.aeoc.business.lut.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.lut.service.LutColorFeatureService;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.security.Principal;
import java.util.List;

@RestController
public class LutFeatureController extends BaseController {

    private static final String URI = "/lut/";

    private final LutColorFeatureService lutColorFeatureService;

    public LutFeatureController(LutColorFeatureService lutColorFeatureService, UserService userService) {
        super(userService);
        this.lutColorFeatureService = lutColorFeatureService;
    }

    @GetMapping("/lut/feature/list")
    public ResponseEntity<ApiResponse<Page<Lut>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String style,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer hasFeature,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            Principal principal
    ) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(
                lutColorFeatureService.list(keyword, style, status, hasFeature, page, limit),
                ApiResponse::okEntity
        );
    }

    @PostMapping("/lut/feature/recompute")
    public ResponseEntity<ApiResponse<List<Lut>>> recompute(
            @RequestBody(required = false) List<Integer> ids,
            Principal principal
    ) {
        checkPermission(principal, URI, "UPDATE");
        return Mapper.map(
                lutColorFeatureService.recompute(ids == null ? List.of() : ids),
                ApiResponse::okEntity
        );
    }
}
