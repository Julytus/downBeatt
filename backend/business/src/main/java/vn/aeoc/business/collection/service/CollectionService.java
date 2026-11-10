package vn.aeoc.business.collection.service;

import org.jooq.exception.IntegrityConstraintViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.billing.service.SubscriptionService;
import vn.aeoc.business.collection.repository.CollectionRepository;
import vn.aeoc.business.collection.repository.CollectionRepository.PublishedItem;
import vn.aeoc.business.lut.service.LutService;
import vn.aeoc.entity.data.mysql.collection.CollectionItem;
import vn.aeoc.entity.data.mysql.collection.LutCollection;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.time.LocalDate;
import java.util.*;

@Service
public class CollectionService extends BaseService<CollectionRepository, LutCollection, Integer> {

    private final LutService lutService;
    private final SubscriptionService subscriptionService;
    private final int freeLimit;

    public CollectionService(CollectionRepository repository,
                             QueryExecutor queryExecutor,
                             LutService lutService,
                             SubscriptionService subscriptionService,
                             @Value("${collection.free-limit:3}") int freeLimit) {
        super(repository, queryExecutor);
        this.lutService = lutService;
        this.subscriptionService = subscriptionService;
        this.freeLimit = freeLimit;
    }

    public List<LutCollection> myList(Integer userId, Integer lutId) {
        List<LutCollection> collections = repository.listByUser(userId);
        if (collections == null || collections.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> collectionIds = collections.stream().map(LutCollection::getId).toList();
        List<PublishedItem> publishedItems = repository.publishedItems(collectionIds);

        Map<Integer, Integer> countByColl = new HashMap<>();
        Map<Integer, List<String>> coversByColl = new HashMap<>();
        if (publishedItems != null) {
            for (PublishedItem item : publishedItems) {
                countByColl.merge(item.collectionId(), 1, Integer::sum);
                List<String> covers = coversByColl.computeIfAbsent(item.collectionId(), k -> new ArrayList<>());
                if (covers.size() < 4 && item.coverUrl() != null) {
                    covers.add(item.coverUrl());
                }
            }
        }

        Set<Integer> containingIds = (lutId != null)
                ? repository.collectionIdsContaining(collectionIds, lutId)
                : null;

        for (LutCollection coll : collections) {
            coll.setItemCount(countByColl.getOrDefault(coll.getId(), 0));
            coll.setCoverUrls(coversByColl.getOrDefault(coll.getId(), List.of()));
            if (lutId != null) {
                coll.setContainsLut(containingIds != null && containingIds.contains(coll.getId()));
            } else {
                coll.setContainsLut(null);
            }
            coll.setUserId(null);
        }

        return collections;
    }

    public LutCollection get(Integer userId, Integer id) {
        if (id == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }
        LutCollection collection = repository.getOwned(id, userId);
        if (collection == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }

        List<PublishedItem> items = repository.publishedItems(List.of(id));
        List<Integer> lutIds = items != null
                ? items.stream().map(PublishedItem::lutId).toList()
                : List.of();
        List<Lut> luts = lutService.listPublishedByIds(lutIds);

        collection.setItemCount(items != null ? items.size() : 0);
        collection.setCoverUrls(items != null
                ? items.stream().limit(4).map(PublishedItem::coverUrl).filter(Objects::nonNull).toList()
                : List.of());
        collection.setLuts(luts);
        collection.setContainsLut(null);
        collection.setUserId(null);
        return collection;
    }

    @Transactional
    public LutCollection upsert(Integer userId, LutCollection body, LocalDate today) {
        if (body == null) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }
        boolean creating = body.getId() == null || body.getId() <= 0;
        if (creating) {
            return create(userId, body, today);
        } else {
            return rename(userId, body);
        }
    }

    private LutCollection create(Integer userId, LutCollection body, LocalDate today) {
        String name = trim(body.getName());

        if (body.getLutId() != null) {
            if (!lutService.isPublished(body.getLutId())) {
                throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT");
            }
        }

        boolean hasActiveSub = subscriptionService.findActiveByUserId(userId, today) != null;
        if (!hasActiveSub) {
            long count = repository.countByUser(userId);
            if (count >= freeLimit) {
                throw new AppException(ErrorCode.COLLECTION_LIMIT);
            }
        }

        if (repository.existsName(userId, name, null)) {
            throw new AppException(ErrorCode.COLLECTION_NAME_EXISTS);
        }

        LutCollection insertPojo = new LutCollection();
        insertPojo.setId(null);
        insertPojo.setUserId(userId);
        insertPojo.setName(name);
        insertPojo.setCreatedTime(null);
        insertPojo.setUpdatedTime(null);

        LutCollection created;
        try {
            created = repository.insertReturning(insertPojo);
        } catch (DuplicateKeyException | IntegrityConstraintViolationException e) {
            throw new AppException(ErrorCode.COLLECTION_NAME_EXISTS);
        }

        Integer newId = created != null ? created.getId() : null;
        if (body.getLutId() != null && newId != null) {
            repository.addItem(newId, body.getLutId());
        }

        LutCollection fresh = newId != null ? repository.getOwned(newId, userId) : null;
        return populateCollection(fresh != null ? fresh : created, body.getLutId() != null ? true : null);
    }

    private LutCollection rename(Integer userId, LutCollection body) {
        Integer id = body.getId();
        LutCollection existing = repository.getOwned(id, userId);
        if (existing == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }

        String name = trim(body.getName());
        if (repository.existsName(userId, name, id)) {
            throw new AppException(ErrorCode.COLLECTION_NAME_EXISTS);
        }

        repository.updateName(id, name);
        LutCollection fresh = repository.getOwned(id, userId);
        if (fresh == null) {
            fresh = existing;
            fresh.setName(name);
        }
        return populateCollection(fresh, null);
    }

    @Transactional
    public Integer delete(Integer userId, Integer id) {
        if (id == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }
        LutCollection collection = repository.getOwned(id, userId);
        if (collection == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }
        repository.delete(id);
        return id;
    }

    @Transactional
    public LutCollection addItem(Integer userId, CollectionItem item) {
        if (item == null || item.getCollectionId() == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }
        LutCollection collection = repository.getOwned(item.getCollectionId(), userId);
        if (collection == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }
        if (item.getLutId() == null || !lutService.isPublished(item.getLutId())) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT");
        }

        int affected = repository.addItem(collection.getId(), item.getLutId());
        if (affected == 1) {
            repository.touch(collection.getId());
        }

        LutCollection fresh = repository.getOwned(collection.getId(), userId);
        return populateCollection(fresh != null ? fresh : collection, true);
    }

    @Transactional
    public LutCollection removeItem(Integer userId, CollectionItem item) {
        if (item == null || item.getCollectionId() == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }
        LutCollection collection = repository.getOwned(item.getCollectionId(), userId);
        if (collection == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy bộ sưu tập");
        }

        if (item.getLutId() != null) {
            int affected = repository.removeItem(collection.getId(), item.getLutId());
            if (affected == 1) {
                repository.touch(collection.getId());
            }
        }

        LutCollection fresh = repository.getOwned(collection.getId(), userId);
        return populateCollection(fresh != null ? fresh : collection, false);
    }

    private LutCollection populateCollection(LutCollection collection, Boolean containsLut) {
        if (collection == null) {
            return null;
        }
        List<PublishedItem> items = collection.getId() != null
                ? repository.publishedItems(List.of(collection.getId()))
                : Collections.emptyList();
        collection.setItemCount(items != null ? items.size() : 0);
        collection.setCoverUrls(items != null
                ? items.stream().limit(4).map(PublishedItem::coverUrl).filter(Objects::nonNull).toList()
                : List.of());
        collection.setContainsLut(containsLut);
        collection.setUserId(null);
        return collection;
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
