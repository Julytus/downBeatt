package vn.aeoc.authenticate.repository.auth;

import org.jooq.DSLContext;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.auth.Role;
import vn.entity.backend.tables.records.RoleRecord;

import static vn.entity.backend.tables.Role.ROLE;

@Repository
public class RoleRepository extends AbsMysqlRepository<RoleRecord, Role, Integer> {
    public RoleRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<RoleRecord> getTable() {
        return ROLE;
    }
}
