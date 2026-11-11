package vn.aeoc.business.recommend.repository;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.recommend.CustomerOption;
import vn.entity.backend.tables.records.UserAppRecord;

import java.util.List;

import static vn.entity.backend.tables.UserApp.USER_APP;

@Repository
public class RecommendCustomerRepository extends AbsMysqlRepository<UserAppRecord, CustomerOption, Integer> {

    public RecommendCustomerRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<UserAppRecord> getTable() {
        return USER_APP;
    }

    public CustomerOption findById(Integer id) {
        if (id == null) {
            return null;
        }
        return dslContext.select(USER_APP.ID, USER_APP.NAME, USER_APP.EMAIL)
                .from(USER_APP)
                .where(USER_APP.ID.eq(id))
                .fetchOneInto(CustomerOption.class);
    }

    public List<CustomerOption> search(String keyword, int limit) {
        int safeLimit = limit <= 0 ? 10 : Math.min(limit, 20);
        Condition cond = DSL.noCondition();
        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim() + "%";
            cond = DSL.condition("({0} LIKE {1} COLLATE utf8mb4_unicode_ci OR {2} LIKE {1} COLLATE utf8mb4_unicode_ci)",
                    USER_APP.EMAIL, kw, USER_APP.NAME);
        }
        return dslContext.select(USER_APP.ID, USER_APP.NAME, USER_APP.EMAIL)
                .from(USER_APP)
                .where(cond)
                .orderBy(USER_APP.REGIS_DATE.desc(), USER_APP.ID.desc())
                .limit(safeLimit)
                .fetchInto(CustomerOption.class);
    }
}
