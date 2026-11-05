package vn.aeoc.business.lut.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.lut.service.LutCategoryService;
import vn.aeoc.entity.data.mysql.lut.LutCategory;

import java.util.List;

@RestController
public class LutCategoryPublicController extends BaseController {
    private final LutCategoryService categoryService;

    public LutCategoryPublicController(LutCategoryService categoryService, UserService userService) {
        super(userService);
        this.categoryService = categoryService;
    }

    @GetMapping("/lut-category/public/list")
    public ResponseEntity<ApiResponse<List<LutCategory>>> list() {
        return Mapper.map(categoryService.listPublic(), ApiResponse::okEntity);
    }

    @GetMapping("/lut-category/public/get")
    public ResponseEntity<ApiResponse<LutCategory>> get(@RequestParam String slug) {
        return Mapper.map(categoryService.getPublic(slug), ApiResponse::okEntity);
    }
}
