package vn.aeoc.business.lut.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.lut.service.LutService;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.util.List;

@RestController
public class LutPublicController extends BaseController {
    private final LutService lutService;

    public LutPublicController(LutService lutService, UserService userService) {
        super(userService);
        this.lutService = lutService;
    }

    @GetMapping("/lut/public/list")
    public ResponseEntity<ApiResponse<Page<Lut>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> keywords,
            @RequestParam(required = false) List<String> styles,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        return Mapper.map(
                lutService.list(q, keywords, styles, category, sort, page, limit),
                ApiResponse::okEntity
        );
    }

    @GetMapping("/lut/public/get")
    public ResponseEntity<ApiResponse<Lut>> get(@RequestParam String slug) {
        return Mapper.map(lutService.get(slug), ApiResponse::okEntity);
    }

    @GetMapping("/lut/public/related")
    public ResponseEntity<ApiResponse<Page<Lut>>> related(
            @RequestParam String slug,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        return Mapper.map(lutService.related(slug, page, limit), ApiResponse::okEntity);
    }

    @GetMapping("/lut/public/suggest")
    public ResponseEntity<ApiResponse<List<Lut>>> suggest(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer limit
    ) {
        return Mapper.map(lutService.suggest(q, limit), ApiResponse::okEntity);
    }
}
