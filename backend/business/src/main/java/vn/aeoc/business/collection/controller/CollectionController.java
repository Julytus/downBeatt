package vn.aeoc.business.collection.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.business.collection.service.CollectionService;
import vn.aeoc.entity.data.mysql.collection.CollectionItem;
import vn.aeoc.entity.data.mysql.collection.LutCollection;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
public class CollectionController extends BaseController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService, UserService userService) {
        super(userService);
        this.collectionService = collectionService;
    }

    @GetMapping("/collection/my-list")
    public ResponseEntity<ApiResponse<List<LutCollection>>> myList(
            @RequestParam(required = false) Integer lutId,
            Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(collectionService.myList(userId, lutId), ApiResponse::okEntity);
    }

    @GetMapping("/collection/get")
    public ResponseEntity<ApiResponse<LutCollection>> get(
            @RequestParam(required = false) Integer id,
            Principal principal) {
        if (id == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(collectionService.get(userId, id), ApiResponse::okEntity);
    }

    @PostMapping("/collection/update")
    public ResponseEntity<ApiResponse<LutCollection>> update(
            @RequestBody(required = false) LutCollection body,
            Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(collectionService.upsert(userId, body, LocalDate.now()), ApiResponse::okEntity);
    }

    @PostMapping("/collection/delete/{id}")
    public ResponseEntity<ApiResponse<Integer>> delete(
            @PathVariable Integer id,
            Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(collectionService.delete(userId, id), ApiResponse::okEntity);
    }

    @PostMapping("/collection/item/add")
    public ResponseEntity<ApiResponse<LutCollection>> addItem(
            @RequestBody CollectionItem body,
            Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(collectionService.addItem(userId, body), ApiResponse::okEntity);
    }

    @PostMapping("/collection/item/remove")
    public ResponseEntity<ApiResponse<LutCollection>> removeItem(
            @RequestBody CollectionItem body,
            Principal principal) {
        Integer userId = SecurityUtils.userId(principal);
        return Mapper.map(collectionService.removeItem(userId, body), ApiResponse::okEntity);
    }
}
