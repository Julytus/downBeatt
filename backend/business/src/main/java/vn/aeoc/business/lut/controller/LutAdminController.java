package vn.aeoc.business.lut.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.lut.service.LutAdminService;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.mysql.lut.Creator;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.security.Principal;
import java.util.List;

@RestController
public class LutAdminController extends BaseController {

    private static final String URI = "/lut/";

    private final LutAdminService lutAdminService;

    public LutAdminController(LutAdminService lutAdminService, UserService userService) {
        super(userService);
        this.lutAdminService = lutAdminService;
    }

    @GetMapping("/lut/list")
    public ResponseEntity<ApiResponse<Page<Lut>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String style,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            Principal principal
    ) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(lutAdminService.list(keyword, status, style, page, limit), ApiResponse::okEntity);
    }

    @GetMapping("/lut/get")
    public ResponseEntity<ApiResponse<Lut>> get(
            @RequestParam Integer id,
            Principal principal
    ) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(lutAdminService.get(id), ApiResponse::okEntity);
    }

    @PostMapping("/lut/update")
    public ResponseEntity<ApiResponse<Lut>> update(
            @RequestBody Lut request,
            Principal principal
    ) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        User login = checkPermission(principal, URI, creating ? "ADD" : "UPDATE");
        return Mapper.map(lutAdminService.upsert(login, request), ApiResponse::okEntity);
    }

    @PostMapping("/lut/delete/{id}")
    public ResponseEntity<ApiResponse<Integer>> delete(
            @PathVariable Integer id,
            Principal principal
    ) {
        checkPermission(principal, URI, "DELETE");
        return Mapper.map(lutAdminService.delete(id), ApiResponse::okEntity);
    }

    @PostMapping("/lut/upload")
    public ResponseEntity<ApiResponse<Lut>> upload(
            @RequestParam Integer id,
            @RequestParam String kind,
            @RequestParam MultipartFile file,
            Principal principal
    ) {
        checkPermission(principal, URI, "UPDATE");
        return Mapper.map(lutAdminService.upload(id, kind, file), ApiResponse::okEntity);
    }

    @PostMapping("/lut/publish/{id}")
    public ResponseEntity<ApiResponse<Lut>> publish(
            @PathVariable Integer id,
            Principal principal
    ) {
        checkPermission(principal, URI, "UPDATE");
        return Mapper.map(lutAdminService.publish(id), ApiResponse::okEntity);
    }

    @PostMapping("/lut/hide/{id}")
    public ResponseEntity<ApiResponse<Lut>> hide(
            @PathVariable Integer id,
            Principal principal
    ) {
        checkPermission(principal, URI, "UPDATE");
        return Mapper.map(lutAdminService.hide(id), ApiResponse::okEntity);
    }

    @GetMapping("/lut/creators")
    public ResponseEntity<ApiResponse<List<Creator>>> creators(Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(lutAdminService.creators(), ApiResponse::okEntity);
    }
}
