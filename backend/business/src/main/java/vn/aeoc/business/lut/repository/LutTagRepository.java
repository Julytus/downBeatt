package vn.aeoc.business.lut.repository;

import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import vn.aeoc.entity.data.mysql.lut.LutTag;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class LutTagRepository {
    private final DSLContext dsl;

    private static final vn.entity.backend.tables.LutTag TAG =
            vn.entity.backend.tables.LutTag.LUT_TAG;

    public List<LutTag> getByLutIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return dsl.select(TAG.LUT_ID, TAG.TAG)
                .from(TAG)
                .where(TAG.LUT_ID.in(ids))
                .orderBy(TAG.TAG.asc())
                .fetchInto(LutTag.class);
    }
}
