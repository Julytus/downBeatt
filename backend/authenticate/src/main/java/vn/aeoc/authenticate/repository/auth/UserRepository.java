package vn.aeoc.authenticate.repository.auth;

import org.apache.commons.lang3.StringUtils;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Table;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.entity.backend.tables.records.UserAppRecord;

import java.util.ArrayList;
import java.util.List;

import static java.util.Arrays.asList;
import static vn.entity.backend.tables.Role.ROLE;
import static vn.entity.backend.tables.UserApp.USER_APP;

@Repository
public class UserRepository extends AbsMysqlRepository<UserAppRecord, User, Integer> {
    public UserRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<UserAppRecord> getTable() {
        return USER_APP;
    }

    private Table<?> getJoinTable() {
        return USER_APP.leftJoin(ROLE).on(ROLE.ID.eq(USER_APP.ROLE_ID));
    }

    private static List<Field<?>> getUserFields() {
        return asList(
                USER_APP.ID,
                USER_APP.NAME,
                USER_APP.ALIAS,
                USER_APP.AVATAR,
                USER_APP.PHONE,
                USER_APP.PHONE_VERIFIED,
                USER_APP.EMAIL,
                USER_APP.REGIS_DATE,
                USER_APP.FIRST_TIME,
                USER_APP.ROLE_ID,
                USER_APP.ACTIVE,
                USER_APP.GENDER
        );
    }

    /** Kèm mật khẩu đã băm (để kiểm tra đăng nhập). Không có => User rỗng (id null). */
    public User getUserByPhone(String phone) {
        if (StringUtils.isBlank(phone)) {
            return new User();
        }
        return getWithPassword(USER_APP.PHONE.eq(phone));
    }

    /** Kèm mật khẩu đã băm (để kiểm tra đăng nhập). Không có => User rỗng (id null). */
    public User getUserByEmail(String email) {
        if (StringUtils.isBlank(email)) {
            return new User();
        }
        return getWithPassword(USER_APP.EMAIL.eq(email));
    }

    private User getWithPassword(org.jooq.Condition condition) {
        List<Field<?>> fields = new ArrayList<>(getUserFields());
        fields.add(USER_APP.PASSWORD);
        return dslContext
                .select(fields)
                .from(USER_APP)
                .where(condition)
                .limit(1)
                .fetchOptionalInto(User.class)
                .orElse(new User());
    }

    /** Thông tin user + tên / cờ operator của role. Không có => User rỗng (id null). */
    public User getUserById(Integer id) {
        List<Field<?>> fields = new ArrayList<>(getUserFields());
        fields.add(ROLE.NAME.as("role_name"));
        fields.add(ROLE.IS_OPERATOR.as("is_operator"));
        return dslContext
                .select(fields)
                .from(getJoinTable())
                .where(USER_APP.ID.eq(id))
                .fetchOptionalInto(User.class)
                .orElse(new User());
    }

    public String getUserPasswordById(Integer id) {
        return dslContext.select(USER_APP.PASSWORD).from(USER_APP).where(USER_APP.ID.eq(id))
                .fetchOptionalInto(String.class)
                .orElse(null);
    }

    public void updatePass(Integer id, String hashedPassword) {
        dslContext.update(USER_APP)
                .set(USER_APP.PASSWORD, hashedPassword)
                .set(USER_APP.HAS_PASSWORD, 1)
                .where(USER_APP.ID.eq(id))
                .execute();
    }
}
