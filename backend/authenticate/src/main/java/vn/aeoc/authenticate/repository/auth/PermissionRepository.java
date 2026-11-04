package vn.aeoc.authenticate.repository.auth;

import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.entity.data.pojo.EBPermissionResource;

import java.util.List;

import static vn.entity.backend.tables.Permission.PERMISSION;
import static vn.entity.backend.tables.Resource.RESOURCE;

/** Đọc quyền của role. Quyền được cấp bằng migration / SQL (chưa có màn hình quản trị). */
@Repository
public class PermissionRepository {
    private final DSLContext dslContext;

    public PermissionRepository(DSLContext dslContext) {
        this.dslContext = dslContext;
    }

    /** Danh sách resource + actions của role (menu phía client); operator => mọi resource. */
    public List<EBPermissionResource> getPermissionResources(Integer roleId, Integer isOperator) {
        if (CommonUtils.NVL(isOperator) >= 1) {
            return dslContext
                    .select(RESOURCE.CODE, RESOURCE.ACTIONS)
                    .from(RESOURCE)
                    .where(RESOURCE.ACTIVE.eq(1))
                    .orderBy(RESOURCE.ID.asc())
                    .fetchInto(EBPermissionResource.class);
        }

        return dslContext
                .select(RESOURCE.CODE, PERMISSION.ACTIONS)
                .from(PERMISSION)
                .join(RESOURCE).on(PERMISSION.RESOURCE_ID.eq(RESOURCE.ID))
                .where(PERMISSION.ROLE_ID.eq(roleId).and(RESOURCE.ACTIVE.eq(1)))
                .orderBy(PERMISSION.RESOURCE_ID.asc())
                .fetchInto(EBPermissionResource.class);
    }

    /** Số permission khớp (role, uri, action); > 0 là có quyền. */
    public Long checkPermission(Integer roleId, String uri, String action) {
        return dslContext
                .selectCount()
                .from(PERMISSION)
                .join(RESOURCE).on(PERMISSION.RESOURCE_ID.eq(RESOURCE.ID))
                .where(PERMISSION.ROLE_ID.eq(roleId)
                        .and(RESOURCE.URI.eq(uri))
                        .and(RESOURCE.ACTIVE.eq(1))
                        .and(DSL.condition("JSON_CONTAINS({0}, JSON_ARRAY({1}))", PERMISSION.ACTIONS, DSL.val(action))))
                .fetchOne(0, Long.class);
    }
}
