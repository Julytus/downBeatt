package vn.aeoc.business.recommend.eval.split;

import vn.aeoc.business.recommend.eval.sim.SimDataset;
import vn.aeoc.business.recommend.eval.sim.SimEvent;
import vn.aeoc.business.recommend.eval.sim.SimUser;
import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.time.LocalDateTime;
import java.util.*;

public class TimeSplitter {

    public static List<EvalCase> split(SimDataset dataset, LutVectorIndex ix, String phase, int popularDays) {
        return split(dataset, ix, phase, popularDays, false, 0);
    }

    public static List<EvalCase> split(SimDataset dataset, LutVectorIndex ix, String phase, int popularDays,
                                       boolean excludeSeen, int newLutDays) {
        if (dataset == null || ix == null) {
            return List.of();
        }

        Map<Integer, Lut> lutMap = new HashMap<>();
        for (Lut lut : dataset.luts()) {
            lutMap.put(lut.getId(), lut);
        }

        Map<Integer, SimUser> userMap = new HashMap<>();
        for (SimUser u : dataset.users()) {
            userMap.put(u.id(), u);
        }

        Map<Integer, List<SimEvent>> userEventsMap = new LinkedHashMap<>();
        for (SimUser u : dataset.users()) {
            userEventsMap.put(u.id(), new ArrayList<>());
        }
        for (SimEvent ev : dataset.events()) {
            userEventsMap.computeIfAbsent(ev.userId(), k -> new ArrayList<>()).add(ev);
        }

        List<SimEvent> allDownloads = dataset.events().stream()
                .filter(ev -> "DOWNLOAD".equalsIgnoreCase(ev.type()))
                .toList();

        List<EvalCase> evalCases = new ArrayList<>();

        for (Map.Entry<Integer, List<SimEvent>> entry : userEventsMap.entrySet()) {
            int userId = entry.getKey();
            List<SimEvent> events = entry.getValue();
            if (events == null || events.isEmpty()) {
                continue;
            }

            events.sort(Comparator.comparing(SimEvent::time).thenComparingInt(SimEvent::order));
            int n = events.size();
            int nProfile = n * 8 / 10;

            List<SimEvent> profileEvents;
            List<SimEvent> testEvents;
            LocalDateTime t0;

            if ("valid".equalsIgnoreCase(phase)) {
                int nTrain = nProfile * 9 / 10;
                if (nTrain <= 0 || nTrain >= events.size() || nTrain >= nProfile) {
                    continue;
                }
                profileEvents = events.subList(0, nTrain);
                testEvents = events.subList(nTrain, nProfile);
                t0 = events.get(nTrain).time();
            } else {
                if (nProfile <= 0 || nProfile >= events.size()) {
                    continue;
                }
                profileEvents = events.subList(0, nProfile);
                testEvents = events.subList(nProfile, n);
                t0 = events.get(nProfile).time();
            }

            // Chỉ giữ người có >= 5 sự kiện phần dựng
            if (profileEvents.size() < 5) {
                continue;
            }

            EvalCase evalCase = buildCase(userId, userMap.get(userId), profileEvents, testEvents, t0,
                    lutMap, ix, allDownloads, popularDays, excludeSeen, newLutDays);
            if (evalCase != null) {
                evalCases.add(evalCase);
            }
        }

        return evalCases;
    }

    public static LinkedHashMap<Integer, List<EvalCase>> coldUser(
            SimDataset dataset, LutVectorIndex ix, List<Integer> nValues, int popularDays,
            boolean excludeSeen, int newLutDays) {
        LinkedHashMap<Integer, List<EvalCase>> result = new LinkedHashMap<>();
        if (dataset == null || ix == null || nValues == null || nValues.isEmpty()) {
            return result;
        }

        List<Integer> sortedNValues = nValues.stream().distinct().sorted().toList();
        for (int n : sortedNValues) {
            result.put(n, new ArrayList<>());
        }

        int maxN = Collections.max(sortedNValues);

        Map<Integer, Lut> lutMap = new HashMap<>();
        for (Lut lut : dataset.luts()) {
            lutMap.put(lut.getId(), lut);
        }

        List<SimUser> sortedUsers = dataset.users().stream()
                .sorted(Comparator.comparingInt(SimUser::id))
                .toList();

        Map<Integer, List<SimEvent>> userEventsMap = new HashMap<>();
        for (SimEvent ev : dataset.events()) {
            userEventsMap.computeIfAbsent(ev.userId(), k -> new ArrayList<>()).add(ev);
        }

        List<SimEvent> allDownloads = dataset.events().stream()
                .filter(ev -> "DOWNLOAD".equalsIgnoreCase(ev.type()))
                .toList();

        for (SimUser user : sortedUsers) {
            // Chỉ xét người có declaredSlugs khác rỗng
            if (user.declaredSlugs() == null || user.declaredSlugs().isEmpty()) {
                continue;
            }

            List<SimEvent> events = userEventsMap.get(user.id());
            if (events == null || events.size() <= maxN) {
                continue;
            }

            events.sort(Comparator.comparing(SimEvent::time).thenComparingInt(SimEvent::order));

            // Kiểm tra xem người dùng có ít nhất 1 LUT rel >= 2 ở MỌI n hay không
            boolean qualifiesAllN = true;
            Map<Integer, EvalCase> userCasesByN = new HashMap<>();

            for (int n : sortedNValues) {
                List<SimEvent> profileEvents = events.subList(0, n);
                List<SimEvent> testEvents = events.subList(n, events.size());
                LocalDateTime t0 = events.get(n).time();

                EvalCase evalCase = buildCase(user.id(), user, profileEvents, testEvents, t0,
                        lutMap, ix, allDownloads, popularDays, excludeSeen, newLutDays);

                if (evalCase == null) {
                    qualifiesAllN = false;
                    break;
                }
                userCasesByN.put(n, evalCase);
            }

            if (qualifiesAllN) {
                for (int n : sortedNValues) {
                    result.get(n).add(userCasesByN.get(n));
                }
            }
        }

        return result;
    }

    private static EvalCase buildCase(int userId, SimUser user, List<SimEvent> profileEvents,
                                      List<SimEvent> testEvents, LocalDateTime t0,
                                      Map<Integer, Lut> lutMap, LutVectorIndex ix,
                                      List<SimEvent> allDownloads, int popularDays,
                                      boolean excludeSeen, int newLutDays) {
        // Tập các LUT đã có sự kiện trọng số dương ở phần dựng
        Set<Integer> profilePositiveLuts = new HashSet<>();
        for (SimEvent ev : profileEvents) {
            String type = ev.type().toUpperCase(Locale.ROOT);
            if ("VIEW".equals(type) || "PREVIEW".equals(type) || "FAVORITE".equals(type) || "DOWNLOAD".equals(type)) {
                profilePositiveLuts.add(ev.lutId());
            }
        }

        // rel trong phần kiểm (lấy mức cao nhất): DOWNLOAD 3, FAVORITE 2, PREVIEW 1
        // LUT đã có sự kiện trọng số dương ở phần dựng, hoặc xuất bản sau t0, thì rel = 0
        Map<Integer, Integer> relMap = new HashMap<>();
        Set<Integer> relevantIds = new HashSet<>();

        for (SimEvent ev : testEvents) {
            int lutId = ev.lutId();
            Lut lut = lutMap.get(lutId);
            if (lut == null) {
                continue;
            }
            if (profilePositiveLuts.contains(lutId)) {
                continue;
            }
            if (lut.getPublishedTime() != null && lut.getPublishedTime().isAfter(t0)) {
                continue;
            }

            String type = ev.type().toUpperCase(Locale.ROOT);
            int score = 0;
            if ("DOWNLOAD".equals(type)) {
                score = 3;
            } else if ("FAVORITE".equals(type)) {
                score = 2;
            } else if ("PREVIEW".equals(type)) {
                score = 1;
            }

            if (score > 0) {
                int currentScore = relMap.getOrDefault(lutId, 0);
                if (score > currentScore) {
                    relMap.put(lutId, score);
                    if (score >= 2) {
                        relevantIds.add(lutId);
                    }
                }
            }
        }

        // Chỉ giữ người có >= 1 LUT rel >= 2
        if (relevantIds.isEmpty()) {
            return null;
        }

        // Ứng viên: LUT có publishedTime <= t0; nếu excludeSeen thì bỏ các LUT có sự kiện dương ở phần dựng
        List<ItemVector> candidates = new ArrayList<>();
        for (ItemVector iv : ix.items()) {
            LocalDateTime pubTime = ix.publishedTime(iv.id());
            if (pubTime != null && (pubTime.isBefore(t0) || pubTime.isEqual(t0))) {
                if (excludeSeen && profilePositiveLuts.contains(iv.id())) {
                    continue;
                }
                candidates.add(iv);
            }
        }

        // newLutIds: LUTs trong ứng viên có publishedTime ∈ (t0 - newLutDays, t0]
        Set<Integer> newLutIds = new HashSet<>();
        if (newLutDays > 0) {
            LocalDateTime newLutThreshold = t0.minusDays(newLutDays);
            for (ItemVector iv : candidates) {
                LocalDateTime pubTime = ix.publishedTime(iv.id());
                if (pubTime != null && pubTime.isAfter(newLutThreshold) && (pubTime.isBefore(t0) || pubTime.isEqual(t0))) {
                    newLutIds.add(iv.id());
                }
            }
        }

        // Gộp phần dựng theo (type, lutId) -> UserSignal
        List<UserSignal> userSignals = new ArrayList<>();
        if (!profileEvents.isEmpty()) {
            record SignalKey(String type, int lutId) {}
            Map<SignalKey, Integer> countMap = new LinkedHashMap<>();
            Map<SignalKey, LocalDateTime> maxTimeMap = new HashMap<>();

            for (SimEvent ev : profileEvents) {
                SignalKey key = new SignalKey(ev.type().toUpperCase(Locale.ROOT), ev.lutId());
                countMap.merge(key, 1, Integer::sum);
                maxTimeMap.merge(key, ev.time(), (t1, t2) -> t1.isAfter(t2) ? t1 : t2);
            }

            for (Map.Entry<SignalKey, Integer> cntEntry : countMap.entrySet()) {
                SignalKey key = cntEntry.getKey();
                String slug = ix.slug(key.lutId());
                userSignals.add(new UserSignal(
                        key.type(),
                        key.lutId(),
                        slug,
                        null,
                        cntEntry.getValue(),
                        maxTimeMap.get(key)
                ));
            }
        }

        // Tính download counts trước t0 và trong 30 ngày trước t0
        LocalDateTime windowStart = t0.minusDays(popularDays);
        Map<Integer, Integer> downloadCountsBeforeT0 = new HashMap<>();
        Map<Integer, Integer> downloadCounts30Days = new HashMap<>();

        for (SimEvent dl : allDownloads) {
            if (dl.time().isBefore(t0)) {
                downloadCountsBeforeT0.merge(dl.lutId(), 1, Integer::sum);
                if (!dl.time().isBefore(windowStart)) {
                    downloadCounts30Days.merge(dl.lutId(), 1, Integer::sum);
                }
            }
        }

        List<String> declaredSlugs = user != null ? user.declaredSlugs() : List.of();

        return new EvalCase(
                userId,
                t0,
                userSignals,
                declaredSlugs,
                candidates,
                relevantIds,
                relMap,
                downloadCountsBeforeT0,
                downloadCounts30Days,
                newLutIds
        );
    }
}
