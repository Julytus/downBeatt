package vn.aeoc.authenticate.repository.auth;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.auth.Role;
import vn.entity.backend.tables.records.RoleRecord;

import java.util.List;

import static vn.entity.backend.tables.Role.ROLE;
import static vn.entity.backend.tables.UserApp.USER_APP;

@Repository
public class RoleRepository extends AbsMysqlRepository<RoleRecord, Role, Integer> {
    public RoleRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<RoleRecord> getTable() {
        return ROLE;
    }

    private Condition getWhereCondition(String keyword) {
        Condition condition = DSL.noCondition();
        if (keyword != null && !keyword.isBlank()) {
            condition = condition.and(ROLE.NAME.likeIgnoreCase("%" + keyword.trim() + "%"));
        }
        return condition;
    }

    public List<Role> list(String keyword, Pageable pageable) {
        return getListByCriteria(getWhereCondition(keyword), ROLE.ID.asc(), pageable);
    }

    public Long count(String keyword) {
        return getCountWithCriteria(getWhereCondition(keyword));
    }

    public boolean existsByName(String name, Integer excludeId) {
        Condition condition = ROLE.NAME.eq(name);
        if (excludeId != null) {
            condition = condition.and(ROLE.ID.ne(excludeId));
        }
        return exists(condition);
    }

    public void updateRole(Role role) {
        updateByCondition(ROLE.ID.eq(role.getId()), role, ROLE.NAME, ROLE.IS_DEFAULT, ROLE.IS_OPERATOR);
    }

    /** Chỉ một chức vụ mặc định: bỏ cờ ở mọi chức vụ khác. */
    public void clearDefaultExcept(Integer roleId) {
        updateFieldByCondition(ROLE.ID.ne(roleId).and(ROLE.IS_DEFAULT.eq(1)), ROLE.IS_DEFAULT, 0);
    }

    /** Số tài khoản đang giữ chức vụ (chặn xoá). */
    public int countUsers(Integer roleId) {
        return dslContext.fetchCount(USER_APP, USER_APP.ROLE_ID.eq(roleId));
    }

    public Role getDefaultCustomerRole() {
        return getOne(ROLE.IS_DEFAULT.eq(1).and(ROLE.IS_OPERATOR.eq(0)));
    }
}
