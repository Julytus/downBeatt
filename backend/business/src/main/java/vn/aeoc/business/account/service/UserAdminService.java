package vn.aeoc.business.account.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.authenticate.service.auth.RefreshTokenService;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.account.repository.UserAdminRepository;
import vn.aeoc.business.billing.service.OrderService;
import vn.aeoc.entity.data.mysql.account.ChangeRoleRequest;
import vn.aeoc.entity.data.mysql.account.UserAdminDetail;
import vn.aeoc.entity.data.mysql.account.UserAdminItem;
import vn.aeoc.entity.data.mysql.account.UserAdminSubscription;
import vn.aeoc.entity.data.mysql.auth.Role;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/** Quản trị tài khoản (resource USER): danh sách, chi tiết, khoá / mở khoá, đổi chức vụ. */
@Service
public class UserAdminService extends BaseService<UserAdminRepository, User, Integer> {
    static final String NOT_FOUND = "Không tìm thấy tài khoản";
    static final String ROLE_REQUIRED = "Vui lòng chọn chức vụ";
    static final String ROLE_NOT_FOUND = "Chức vụ không tồn tại";
    static final String SELF_LOCK = "Không thể khoá tài khoản của chính bạn";
    static final String SELF_ROLE = "Không thể đổi chức vụ của chính bạn";
    static final String OPERATOR_TARGET = "Chỉ tài khoản toàn quyền mới được thao tác trên tài khoản toàn quyền";
    static final String OPERATOR_GRANT = "Chỉ tài khoản toàn quyền mới được cấp chức vụ toàn quyền";

    private static final Set<String> PLAN_CODES = Set.of("free", "pro", "studio");
    private static final Set<String> STATUSES = Set.of("ACTIVE", "LOCKED");
    private static final int RECENT_LIMIT = 10;

    private final RefreshTokenService refreshTokenService;
    private final UserService userService;
    private final OrderService orderService;

    public UserAdminService(UserAdminRepository repository,
                            QueryExecutor queryExecutor,
                            RefreshTokenService refreshTokenService,
                            UserService userService,
                            OrderService orderService) {
        super(repository, queryExecutor);
        this.refreshTokenService = refreshTokenService;
        this.userService = userService;
        this.orderService = orderService;
    }

    public Page<UserAdminItem> list(String keyword, Integer roleId, String planCode, String status,
                                    Integer page, Integer limit) {
        String kw = trim(keyword);
        Integer role = (roleId == null || roleId <= 0) ? null : roleId;
        String plan = planCode == null ? null : planCode.trim().toLowerCase(Locale.ROOT);
        if (plan != null && !PLAN_CODES.contains(plan)) plan = null;
        String st = status == null ? null : status.trim().toUpperCase(Locale.ROOT);
        if (st != null && !STATUSES.contains(st)) st = null;
        int p = (page == null || page < 1) ? 1 : page;
        int l = (limit == null || limit < 1) ? 10 : Math.min(limit, 100);

        List<UserAdminItem> items = repository.findPage(kw, role, plan, st, (p - 1) * l, l);
        long total = repository.count(kw, role, plan, st);
        return new Page<>(total, p, items == null ? List.of() : items);
    }

    public UserAdminDetail get(Integer id) {
        UserAdminItem item = requireItem(id);
        UserAdminDetail detail = new UserAdminDetail();
        copy(item, detail);

        UserAdminSubscription subscription = repository.activeSubscription(item.getId());
        if (subscription == null) {
            subscription = new UserAdminSubscription();
            subscription.setPlanCode("free");
            subscription.setPlanName(item.getPlanName());
        }
        detail.setSubscription(subscription);
        detail.setStats(repository.stats(item.getId()));
        detail.setPreferences(nonNull(repository.preferences(item.getId())));
        Page<PaymentOrder> orders = orderService.myList(item.getId(), 1, RECENT_LIMIT);
        detail.setRecentOrders(orders == null ? List.of() : nonNull(orders.getItems()));
        detail.setRecentDownloads(nonNull(repository.recentDownloads(item.getId(), RECENT_LIMIT)));
        return detail;
    }

    @Transactional
    public UserAdminItem lock(User caller, Integer id) {
        UserAdminItem target = requireItem(id);
        checkTarget(caller, target, SELF_LOCK);
        repository.setActive(target.getId(), 0);
        refreshTokenService.revokeAll(target.getId());
        userService.evictAuthUser(target.getId());
        return repository.findItem(target.getId());
    }

    @Transactional
    public UserAdminItem unlock(User caller, Integer id) {
        UserAdminItem target = requireItem(id);
        checkTarget(caller, target, SELF_LOCK);
        repository.setActive(target.getId(), 1);
        userService.evictAuthUser(target.getId());
        return repository.findItem(target.getId());
    }

    @Transactional
    public UserAdminItem changeRole(User caller, ChangeRoleRequest request) {
        UserAdminItem target = requireItem(request == null ? null : request.getId());
        Integer roleId = request.getRoleId();
        if (roleId == null || roleId <= 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, ROLE_REQUIRED);
        }
        Role role = repository.findRole(roleId);
        if (role == null || role.getId() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, ROLE_NOT_FOUND);
        }
        checkTarget(caller, target, SELF_ROLE);
        if (!isOperator(caller) && Integer.valueOf(1).equals(role.getIsOperator())) {
            throw new AppException(ErrorCode.BAD_REQUEST, OPERATOR_GRANT);
        }
        repository.setRole(target.getId(), roleId);
        userService.evictAuthUser(target.getId());
        return repository.findItem(target.getId());
    }

    public List<Role> roleOptions() {
        return nonNull(repository.roleOptions());
    }

    /** Luật §5.7 số 1 và 2. */
    private void checkTarget(User caller, UserAdminItem target, String selfMessage) {
        if (caller != null && caller.getId() != null && Objects.equals(caller.getId(), target.getId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, selfMessage);
        }
        if (!isOperator(caller) && Integer.valueOf(1).equals(target.getIsOperator())) {
            throw new AppException(ErrorCode.BAD_REQUEST, OPERATOR_TARGET);
        }
    }

    private static boolean isOperator(User caller) {
        return caller != null && Integer.valueOf(1).equals(caller.getIsOperator());
    }

    private UserAdminItem requireItem(Integer id) {
        UserAdminItem item = (id == null || id <= 0) ? null : repository.findItem(id);
        if (item == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, NOT_FOUND);
        }
        return item;
    }

    private static void copy(UserAdminItem from, UserAdminItem to) {
        to.setId(from.getId());
        to.setName(from.getName());
        to.setEmail(from.getEmail());
        to.setPhone(from.getPhone());
        to.setAvatar(from.getAvatar());
        to.setRoleId(from.getRoleId());
        to.setRoleName(from.getRoleName());
        to.setIsOperator(from.getIsOperator());
        to.setStatus(from.getStatus());
        to.setRegisDate(from.getRegisDate());
        to.setPlanCode(from.getPlanCode());
        to.setPlanName(from.getPlanName());
        to.setPlanExpiresAt(from.getPlanExpiresAt());
    }

    private static <T> List<T> nonNull(List<T> list) {
        return list == null ? List.of() : list;
    }

    private static String trim(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
