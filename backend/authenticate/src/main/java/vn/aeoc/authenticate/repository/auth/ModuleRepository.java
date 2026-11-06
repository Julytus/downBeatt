package vn.aeoc.authenticate.repository.auth;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.auth.Module;
import vn.entity.backend.tables.records.ModuleRecord;

import java.util.List;

import static vn.entity.backend.tables.Module.MODULE;

@Repository
public class ModuleRepository extends AbsMysqlRepository<ModuleRecord, Module, Integer> {
    public ModuleRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<ModuleRecord> getTable() {
        return MODULE;
    }

    private Condition getWhereCondition(String keyword) {
        Condition condition = DSL.noCondition();
        if (keyword != null && !keyword.isBlank()) {
            String like = "%" + keyword.trim() + "%";
            condition = condition.and(MODULE.NAME.likeIgnoreCase(like).or(MODULE.CODE.likeIgnoreCase(like)));
        }
        return condition;
    }

    public List<Module> list(String keyword, Pageable pageable) {
        return getListByCriteria(getWhereCondition(keyword), MODULE.ID.asc(), pageable);
    }

    public Long count(String keyword) {
        return getCountWithCriteria(getWhereCondition(keyword));
    }

    /** Mã đã có ở module khác (excludeId = module đang sửa, null khi tạo). */
    public boolean existsByCode(String code, Integer excludeId) {
        Condition condition = MODULE.CODE.eq(code);
        if (excludeId != null) {
            condition = condition.and(MODULE.ID.ne(excludeId));
        }
        return exists(condition);
    }

    public void updateModule(Module module) {
        updateByCondition(MODULE.ID.eq(module.getId()), module,
                MODULE.NAME, MODULE.CODE, MODULE.DESCRIPTION, MODULE.ACTIVE);
    }
}
