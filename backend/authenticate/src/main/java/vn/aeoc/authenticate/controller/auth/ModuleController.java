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
import vn.aeoc.authenticate.service.auth.ModuleService;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.entity.data.mysql.auth.Module;

import java.security.Principal;
import java.util.List;

import static vn.aeoc.authenticate.util.Mapper.map;

@RestController
public class ModuleController extends BaseController {
    private static final String URI = "/module/";

    private final ModuleService moduleService;

    public ModuleController(ModuleService moduleService, UserService userService) {
        super(userService);
        this.moduleService = moduleService;
    }

    @GetMapping("/module/list")
    public ResponseEntity<ApiResponse<Page<Module>>> list(
            @RequestParam(required = false) String keyword,
            @ParameterObject Pageable pageable,
            Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return map(moduleService.list(keyword, pageable), ApiResponse::okEntity);
    }

    @GetMapping("/module/get")
    public ResponseEntity<ApiResponse<Module>> get(@RequestParam Integer id, Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return map(moduleService.get(id), ApiResponse::okEntity);
    }

    @PostMapping("/module/update")
    public ResponseEntity<ApiResponse<Module>> update(@RequestBody Module request, Principal principal) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        checkPermission(principal, URI, creating ? "ADD" : "UPDATE");
        return map(moduleService.upsert(request), ApiResponse::okEntity);
    }

    @PostMapping("/module/delete/{id}")
    public ResponseEntity<ApiResponse<Integer>> delete(@PathVariable Integer id, Principal principal) {
        checkPermission(principal, URI, "DELETE");
        return map(moduleService.delete(id), ApiResponse::okEntity);
    }

    /** Body: mảng id tài nguyên gán vào module {id}. Trả số tài nguyên đã gán. */
    @PostMapping("/module/assign-resources/{id}")
    public ResponseEntity<ApiResponse<Integer>> assignResources(@PathVariable Integer id,
                                                                @RequestBody List<Integer> resourceIds,
                                                                Principal principal) {
        checkPermission(principal, URI, "UPDATE");
        return map(moduleService.assignResources(id, resourceIds), ApiResponse::okEntity);
    }
}
