package vn.aeoc.authenticate.repository.auth;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.auth.RefreshToken;
import vn.entity.backend.tables.records.RefreshTokenRecord;

import java.time.LocalDateTime;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.val;
import static vn.entity.backend.tables.RefreshToken.REFRESH_TOKEN;

@Repository
public class RefreshTokenRepository extends AbsMysqlRepository<RefreshTokenRecord, RefreshToken, Long> {
    /** Giờ của DB (không dùng giờ JVM) để so hạn token. */
    private static final Field<LocalDateTime> NOW = field("CURRENT_TIMESTAMP", LocalDateTime.class);

    public RefreshTokenRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<RefreshTokenRecord> getTable() {
        return REFRESH_TOKEN;
    }

    public void insert(Integer userId, String hash, int ttlSeconds) {
        dslContext.insertInto(REFRESH_TOKEN)
                .set(REFRESH_TOKEN.USER_ID, userId)
                .set(REFRESH_TOKEN.TOKEN_HASH, hash)
                .set(REFRESH_TOKEN.EXPIRES_AT,
                        field("TIMESTAMPADD(SECOND, {0}, CURRENT_TIMESTAMP)", LocalDateTime.class, val(ttlSeconds)))
                .execute();
    }

    public RefreshToken findValidByHash(String hash) {
        return getOne(byHash(hash).and(REFRESH_TOKEN.EXPIRES_AT.gt(NOW)));
    }

    public RefreshToken findByHash(String hash) {
        return getOne(byHash(hash));
    }

    public void deleteByUserId(Integer userId) {
        delete(REFRESH_TOKEN.USER_ID.eq(userId));
    }

    /**
     * Đọc id trước (đọc không khoá) rồi mới xoá theo khoá chính: DELETE theo user_id trên tài khoản chưa có dòng nào
     * giữ gap lock ở index user_id, hai lần đăng ký đồng thời (user_id liền nhau) sẽ deadlock khi INSERT.
     */
    public void deleteExpiredByUserId(Integer userId) {
        java.util.List<Long> ids = dslContext.select(REFRESH_TOKEN.ID).from(REFRESH_TOKEN)
                .where(REFRESH_TOKEN.USER_ID.eq(userId).and(REFRESH_TOKEN.EXPIRES_AT.le(NOW)))
                .fetchInto(Long.class);
        if (!ids.isEmpty()) delete(REFRESH_TOKEN.ID.in(ids));
    }

    private static Condition byHash(String hash) {
        return REFRESH_TOKEN.TOKEN_HASH.eq(hash);
    }
}
