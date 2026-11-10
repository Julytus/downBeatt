package vn.aeoc.business.collection.repository;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.business.lut.constant.LutStatus;
import vn.aeoc.entity.data.mysql.collection.LutCollection;
import vn.entity.backend.tables.records.CollectionRecord;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static vn.entity.backend.Tables.COLLECTION;
import static vn.entity.backend.Tables.COLLECTION_ITEM;
import static vn.entity.backend.Tables.LUT;

@Repository
public class CollectionRepository extends AbsMysqlRepository<CollectionRecord, LutCollection, Integer> {

    public record PublishedItem(Integer collectionId, Integer lutId, String coverUrl) {}

    public CollectionRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<CollectionRecord> getTable() {
        return COLLECTION;
    }

    public List<LutCollection> listByUser(Integer userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        return dslContext
                .select(COLLECTION.fields())
                .from(COLLECTION)
                .where(COLLECTION.USER_ID.eq(userId))
                .orderBy(COLLECTION.UPDATED_TIME.desc(), COLLECTION.ID.desc())
                .fetchInto(LutCollection.class);
    }

    public LutCollection getOwned(Integer id, Integer userId) {
        if (id == null || userId == null) {
            return null;
        }
        return getOne(COLLECTION.ID.eq(id).and(COLLECTION.USER_ID.eq(userId)));
    }

    public Long countByUser(Integer userId) {
        if (userId == null) {
            return 0L;
        }
        return getCountWithCriteria(COLLECTION.USER_ID.eq(userId));
    }

    public boolean existsName(Integer userId, String name, Integer excludeId) {
        if (userId == null || name == null) {
            return false;
        }
        Condition condition = COLLECTION.USER_ID.eq(userId).and(COLLECTION.NAME.eq(name));
        if (excludeId != null) {
            condition = condition.and(COLLECTION.ID.ne(excludeId));
        }
        return exists(condition);
    }

    public void updateName(Integer id, String name) {
        updateFieldByCondition(COLLECTION.ID.eq(id), COLLECTION.NAME, name);
    }

    public void touch(Integer id) {
        if (id == null) {
            return;
        }
        dslContext.update(COLLECTION)
                .set(COLLECTION.UPDATED_TIME, DSL.currentLocalDateTime())
                .where(COLLECTION.ID.eq(id))
                .execute();
    }

    public int addItem(Integer collectionId, Integer lutId) {
        return dslContext.insertInto(COLLECTION_ITEM)
                .set(COLLECTION_ITEM.COLLECTION_ID, collectionId)
                .set(COLLECTION_ITEM.LUT_ID, lutId)
                .onDuplicateKeyIgnore()
                .execute();
    }

    public int removeItem(Integer collectionId, Integer lutId) {
        return dslContext.deleteFrom(COLLECTION_ITEM)
                .where(COLLECTION_ITEM.COLLECTION_ID.eq(collectionId)
                        .and(COLLECTION_ITEM.LUT_ID.eq(lutId)))
                .execute();
    }

    public List<PublishedItem> publishedItems(Collection<Integer> collectionIds) {
        if (collectionIds == null || collectionIds.isEmpty()) {
            return List.of();
        }
        return dslContext
                .select(COLLECTION_ITEM.COLLECTION_ID, COLLECTION_ITEM.LUT_ID, LUT.COVER_URL)
                .from(COLLECTION_ITEM)
                .join(LUT).on(LUT.ID.eq(COLLECTION_ITEM.LUT_ID))
                .where(COLLECTION_ITEM.COLLECTION_ID.in(collectionIds)
                        .and(LUT.STATUS.eq(LutStatus.PUBLISHED.name())))
                .orderBy(COLLECTION_ITEM.CREATED_TIME.desc(), LUT.ID.desc())
                .fetch(r -> new PublishedItem(
                        r.get(COLLECTION_ITEM.COLLECTION_ID),
                        r.get(COLLECTION_ITEM.LUT_ID),
                        r.get(LUT.COVER_URL)
                ));
    }

    public Set<Integer> collectionIdsContaining(Collection<Integer> collectionIds, Integer lutId) {
        if (collectionIds == null || collectionIds.isEmpty() || lutId == null) {
            return Set.of();
        }
        return dslContext
                .select(COLLECTION_ITEM.COLLECTION_ID)
                .from(COLLECTION_ITEM)
                .where(COLLECTION_ITEM.COLLECTION_ID.in(collectionIds)
                        .and(COLLECTION_ITEM.LUT_ID.eq(lutId)))
                .fetchSet(COLLECTION_ITEM.COLLECTION_ID);
    }
}
