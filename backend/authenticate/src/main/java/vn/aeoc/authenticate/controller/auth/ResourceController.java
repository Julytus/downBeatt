package vn.aeoc.authenticate.controller.auth;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.ResourceService;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.entity.data.mysql.auth.Resource;

import java.security.Principal;

import static vn.aeoc.authenticate.util.Mapper.map;

@RestController
public class ResourceController extends BaseController {
    private static final String URI = "/resource/";

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService, UserService userService) {
        super(userService);
        this.resourceService = resourceService;
    }

    @GetMapping("/resource/list")
    public ResponseEntity<ApiResponse<Page<Resource>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer moduleId,
            @RequestParam(required = false) Boolean unassigned,
            @ParameterObject Pageable pageable,
            Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return map(resourceService.list(keyword, moduleId, unassigned, pageable), ApiResponse::okEntity);
    }

    @GetMapping("/resource/get")
    public ResponseEntity<ApiResponse<Resource>> get(@RequestParam Integer id, Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return map(resourceService.get(id), ApiResponse::okEntity);
    }

    @PostMapping("/resource/update")
    public ResponseEntity<ApiResponse<Resource>> update(@RequestBody Resource request, Principal principal) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        checkPermission(principal, URI, creating ? "ADD" : "UPDATE");
        return map(resourceService.upsert(request), ApiResponse::okEntity);
    }

    @PostMapping("/resource/delete/{id}")
    public ResponseEntity<ApiResponse<Integer>> delete(@PathVariable Integer id, Principal principal) {
        checkPermission(principal, URI, "DELETE");
        return map(resourceService.delete(id), ApiResponse::okEntity);
    }
}
