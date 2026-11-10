package vn.aeoc.business.lut.repository;

import org.jooq.DSLContext;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.lut.LutColorFeature;
import vn.entity.backend.tables.records.LutColorFeatureRecord;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static vn.entity.backend.tables.LutColorFeature.LUT_COLOR_FEATURE;

@Repository
public class LutColorFeatureRepository extends AbsMysqlRepository<LutColorFeatureRecord, LutColorFeature, Integer> {

    public LutColorFeatureRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<LutColorFeatureRecord> getTable() {
        return LUT_COLOR_FEATURE;
    }

    public void upsert(LutColorFeature feature) {
        LocalDateTime now = feature.getComputedTime() != null
                ? feature.getComputedTime()
                : LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        feature.setComputedTime(now);

        Byte isMonoByte = feature.getIsMono() != null ? feature.getIsMono().byteValue() : (byte) 0;

        dslContext.insertInto(LUT_COLOR_FEATURE)
                .set(LUT_COLOR_FEATURE.LUT_ID, feature.getLutId())
                .set(LUT_COLOR_FEATURE.BRIGHTNESS, feature.getBrightness())
                .set(LUT_COLOR_FEATURE.CONTRAST, feature.getContrast())
                .set(LUT_COLOR_FEATURE.SATURATION, feature.getSaturation())
                .set(LUT_COLOR_FEATURE.WARMTH, feature.getWarmth())
                .set(LUT_COLOR_FEATURE.TINT, feature.getTint())
                .set(LUT_COLOR_FEATURE.SHADOW_A, feature.getShadowA())
                .set(LUT_COLOR_FEATURE.SHADOW_B, feature.getShadowB())
                .set(LUT_COLOR_FEATURE.HIGHLIGHT_A, feature.getHighlightA())
                .set(LUT_COLOR_FEATURE.HIGHLIGHT_B, feature.getHighlightB())
                .set(LUT_COLOR_FEATURE.IS_MONO, isMonoByte)
                .set(LUT_COLOR_FEATURE.COMPUTED_TIME, now)
                .onDuplicateKeyUpdate()
                .set(LUT_COLOR_FEATURE.BRIGHTNESS, feature.getBrightness())
                .set(LUT_COLOR_FEATURE.CONTRAST, feature.getContrast())
                .set(LUT_COLOR_FEATURE.SATURATION, feature.getSaturation())
                .set(LUT_COLOR_FEATURE.WARMTH, feature.getWarmth())
                .set(LUT_COLOR_FEATURE.TINT, feature.getTint())
                .set(LUT_COLOR_FEATURE.SHADOW_A, feature.getShadowA())
                .set(LUT_COLOR_FEATURE.SHADOW_B, feature.getShadowB())
                .set(LUT_COLOR_FEATURE.HIGHLIGHT_A, feature.getHighlightA())
                .set(LUT_COLOR_FEATURE.HIGHLIGHT_B, feature.getHighlightB())
                .set(LUT_COLOR_FEATURE.IS_MONO, isMonoByte)
                .set(LUT_COLOR_FEATURE.COMPUTED_TIME, now)
                .execute();
    }

    public List<LutColorFeature> getByLutIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return dslContext.selectFrom(LUT_COLOR_FEATURE)
                .where(LUT_COLOR_FEATURE.LUT_ID.in(ids))
                .fetchInto(LutColorFeature.class);
    }

    public List<Integer> getLutIdsWithFeature() {
        return dslContext.select(LUT_COLOR_FEATURE.LUT_ID)
                .from(LUT_COLOR_FEATURE)
                .fetch(LUT_COLOR_FEATURE.LUT_ID);
    }
}
