package vn.aeoc.authenticate.repository.auth;

import org.jooq.DSLContext;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.auth.RefreshToken;
import vn.entity.backend.tables.records.RefreshTokenRecord;
import java.util.List;
import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.val;
import java.time.LocalDateTime;
import static vn.entity.backend.tables.RefreshToken.REFRESH_TOKEN;

@Repository
public class RefreshTokenRepository extends AbsMysqlRepository<RefreshTokenRecord, RefreshToken, Long> {
    public RefreshTokenRepository(DSLContext dslContext) { super(dslContext); }
    @Override protected TableImpl<RefreshTokenRecord> getTable() { return REFRESH_TOKEN; }

    public void insert(Integer userId, String hash, int ttlSeconds) {
        dslContext.insertInto(REFRESH_TOKEN)
                .set(REFRESH_TOKEN.USER_ID, userId)
                .set(REFRESH_TOKEN.TOKEN_HASH, hash)
                .set(REFRESH_TOKEN.EXPIRES_AT, dslContext.select(field("TIMESTAMPADD(SECOND, {0}, CURRENT_TIMESTAMP)", LocalDateTime.class, val(ttlSeconds))).fetchOne(0, LocalDateTime.class))
                .execute();
    }

    public RefreshToken findValidByHash(String hash) {
        return dslContext.selectFrom(REFRESH_TOKEN).where(REFRESH_TOKEN.TOKEN_HASH.eq(hash)
                .and(REFRESH_TOKEN.EXPIRES_AT.gt(field("CURRENT_TIMESTAMP", LocalDateTime.class)))).fetchOptionalInto(RefreshToken.class).orElse(null);
    }
    public RefreshToken findByHash(String hash) {
        return dslContext.selectFrom(REFRESH_TOKEN).where(REFRESH_TOKEN.TOKEN_HASH.eq(hash)).fetchOptionalInto(RefreshToken.class).orElse(null);
    }
    public int deleteById(Long id) { return delete(id); }
    public void deleteByUserId(Integer userId) { dslContext.deleteFrom(REFRESH_TOKEN).where(REFRESH_TOKEN.USER_ID.eq(userId)).execute(); }
    public void deleteExpiredByUserId(Integer userId) { dslContext.deleteFrom(REFRESH_TOKEN).where(REFRESH_TOKEN.USER_ID.eq(userId).and(REFRESH_TOKEN.EXPIRES_AT.le(field("CURRENT_TIMESTAMP", LocalDateTime.class)))).execute(); }
}
