package vn.aeoc.authenticate.repository.auth;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.auth.Resource;
import vn.entity.backend.tables.records.ResourceRecord;

import java.util.List;

import static vn.entity.backend.tables.Resource.RESOURCE;

@Repository
public class ResourceRepository extends AbsMysqlRepository<ResourceRecord, Resource, Integer> {
    public ResourceRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<ResourceRecord> getTable() {
        return RESOURCE;
    }

    /** unassigned = true: chỉ resource chưa thuộc module nào. */
    private Condition getWhereCondition(String keyword, Integer moduleId, Boolean unassigned) {
        Condition condition = DSL.noCondition();
        if (keyword != null && !keyword.isBlank()) {
            String like = "%" + keyword.trim() + "%";
            condition = condition.and(RESOURCE.NAME.likeIgnoreCase(like)
                    .or(RESOURCE.CODE.likeIgnoreCase(like))
                    .or(RESOURCE.URI.likeIgnoreCase(like)));
        }
        if (moduleId != null) {
            condition = condition.and(RESOURCE.MODULE_ID.eq(moduleId));
        }
        if (Boolean.TRUE.equals(unassigned)) {
            condition = condition.and(RESOURCE.MODULE_ID.isNull());
        }
        return condition;
    }

    public List<Resource> list(String keyword, Integer moduleId, Boolean unassigned, Pageable pageable) {
        return getListByCriteria(getWhereCondition(keyword, moduleId, unassigned), RESOURCE.ID.asc(), pageable);
    }

    public Long count(String keyword, Integer moduleId, Boolean unassigned) {
        return getCountWithCriteria(getWhereCondition(keyword, moduleId, unassigned));
    }

    /** Mọi resource (ma trận phân quyền), theo module rồi id. */
    public List<Resource> listAll() {
        return getListByCriteria(DSL.noCondition(), RESOURCE.ID.asc());
    }

    public boolean existsByCode(String code, Integer excludeId) {
        Condition condition = RESOURCE.CODE.eq(code);
        if (excludeId != null) {
            condition = condition.and(RESOURCE.ID.ne(excludeId));
        }
        return exists(condition);
    }

    public void updateResource(Resource resource) {
        updateByCondition(RESOURCE.ID.eq(resource.getId()), resource,
                RESOURCE.NAME, RESOURCE.DESCRIPTION, RESOURCE.CODE, RESOURCE.URI, RESOURCE.ACTIONS, RESOURCE.ACTIVE);
    }

    public Integer assignModule(Integer moduleId, List<Integer> resourceIds) {
        return updateFieldByCondition(RESOURCE.ID.in(resourceIds), RESOURCE.MODULE_ID, moduleId);
    }

    /** Gỡ module khỏi mọi resource của nó (trước khi xoá module, vì có khoá ngoại). */
    public Integer clearModule(Integer moduleId) {
        return updateFieldByCondition(RESOURCE.MODULE_ID.eq(moduleId), RESOURCE.MODULE_ID, null);
    }
}
