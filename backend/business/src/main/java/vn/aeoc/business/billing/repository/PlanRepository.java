package vn.aeoc.business.billing.repository;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.billing.Plan;
import vn.entity.backend.tables.records.PlanRecord;

import java.util.List;

import static vn.entity.backend.Tables.PLAN;

@Repository
public class PlanRepository extends AbsMysqlRepository<PlanRecord, Plan, Integer> {
    public PlanRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<PlanRecord> getTable() {
        return PLAN;
    }

    public List<Plan> findActivePlans() {
        return dslContext.select(getFiled())
                .from(PLAN)
                .where(PLAN.ACTIVE.eq((byte) 1))
                .orderBy(PLAN.SORT_ORDER.asc())
                .fetchInto(pojoClass);
    }

    public Plan findByCode(String code) {
        if (code == null) {
            return null;
        }
        return getOne(PLAN.CODE.eq(code));
    }
}
