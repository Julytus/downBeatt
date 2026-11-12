package vn.aeoc.business.recommend.eval.sim;

import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.time.LocalDateTime;
import java.util.*;

public class UserSimulator {

    private static final List<String> STYLES = CatalogGenerator.STYLES;
    private static final double[] STYLE_WEIGHTS = {
            0.20, // am-ap
            0.15, // lanh
            0.17, // phim-nhua
            0.13, // dien-anh
            0.08, // teal-orange
            0.11, // du-lich
            0.10, // co-dien
            0.06  // den-trang
    };

    private record UserData(
            int id,
            List<String> preferredStyles,
            List<String> declaredSlugs,
            double[] c_u,
            double beta_u,
            int e_u,
            List<UserSessionInfo> sessions
    ) {}

    private record UserSessionInfo(
            int userId,
            LocalDateTime time,
            int sessionIdx,
            SplittableRandom sessionRng
    ) {}

    public static SimDataset simulate(List<Lut> luts, LutVectorIndex ix, int n, long seed, SplittableRandom rng) {
        SplittableRandom userRng = rng.split();
        SplittableRandom sessionRngRoot = rng.split();

        LocalDateTime baseDate = LocalDateTime.of(2026, 1, 1, 0, 0, 0);
        long startSec = 30L * 24 * 3600;
        long rangeSec = 90L * 24 * 3600;

        List<UserData> usersData = new ArrayList<>(n);
        List<SimUser> simUsers = new ArrayList<>(n);
        List<UserSessionInfo> allSessions = new ArrayList<>();

        for (int u = 1; u <= n; u++) {
            // 1. Số phong cách ưa thích 1 (0.6) hoặc 2
            int numStyles = userRng.nextDouble() < 0.60 ? 1 : 2;
            List<String> prefStyles = sampleStyles(numStyles, userRng);

            // Khai báo sở thích
            boolean declares = userRng.nextDouble() < 0.70;
            List<String> declaredSlugs;
            if (!declares) {
                declaredSlugs = List.of();
            } else {
                if (userRng.nextDouble() < 0.80) {
                    declaredSlugs = new ArrayList<>(prefStyles);
                } else {
                    declaredSlugs = List.of(STYLES.get(userRng.nextInt(8)));
                }
            }

            // c_u: trung bình colorZ của các LUT có phong cách ưa thích đầu tiên + N(0, 0.5) từng chiều
            String firstStyle = prefStyles.get(0);
            double[] c_u = new double[10];
            int countStyle = 0;
            for (Lut lut : luts) {
                if (firstStyle.equals(lut.getStyle())) {
                    double[] z = ix.colorZ(lut.getId());
                    for (int d = 0; d < 10; d++) {
                        c_u[d] += z[d];
                    }
                    countStyle++;
                }
            }
            if (countStyle > 0) {
                for (int d = 0; d < 10; d++) {
                    c_u[d] /= countStyle;
                }
            }
            for (int d = 0; d < 10; d++) {
                c_u[d] += 0.5 * CatalogGenerator.nextGaussian(userRng);
            }

            // beta_u in U[0, 0.5]
            double beta_u = userRng.nextDouble() * 0.5;

            // E_u in U{20..60}
            int e_u = 20 + userRng.nextInt(41);

            // Phiên
            int s_u = (int) Math.ceil(e_u / 2.0);
            List<Long> sessionSeconds = new ArrayList<>(s_u);
            for (int s = 0; s < s_u; s++) {
                sessionSeconds.add(startSec + (long) (userRng.nextDouble() * rangeSec));
            }
            sessionSeconds.sort(Long::compareTo);

            SplittableRandom userSessionRng = sessionRngRoot.split();
            List<UserSessionInfo> userSessions = new ArrayList<>(s_u);
            for (int s = 0; s < s_u; s++) {
                LocalDateTime sTime = baseDate.plusSeconds(sessionSeconds.get(s));
                UserSessionInfo sInfo = new UserSessionInfo(u, sTime, s, userSessionRng.split());
                userSessions.add(sInfo);
                allSessions.add(sInfo);
            }

            UserData ud = new UserData(u, prefStyles, declaredSlugs, c_u, beta_u, e_u, userSessions);
            usersData.add(ud);
            simUsers.add(new SimUser(u, prefStyles, declaredSlugs));
        }

        // Sắp xếp mọi phiên của mọi người theo thời gian toàn cục
        allSessions.sort(Comparator.comparing(UserSessionInfo::time)
                .thenComparingInt(UserSessionInfo::userId)
                .thenComparingInt(UserSessionInfo::sessionIdx));

        // Precompute epsilon(u, i)
        int maxLutId = luts.size();
        double[][] epsTable = new double[n + 1][maxLutId + 1];
        for (int u = 1; u <= n; u++) {
            for (int i = 1; i <= maxLutId; i++) {
                epsTable[u][i] = computeEpsilon(seed, u, i);
            }
        }

        // Trạng thái mô phỏng toàn cục
        int[] globalDownloads = new int[maxLutId + 1];
        List<Set<Integer>> userDownloaded = new ArrayList<>(n + 1);
        List<Set<Integer>> userDismissed = new ArrayList<>(n + 1);
        List<Set<Integer>> userFavorited = new ArrayList<>(n + 1);
        List<Set<Integer>> userPreviewed = new ArrayList<>(n + 1);
        int[] userEventCounts = new int[n + 1];

        for (int u = 0; u <= n; u++) {
            userDownloaded.add(new HashSet<>());
            userDismissed.add(new HashSet<>());
            userFavorited.add(new HashSet<>());
            userPreviewed.add(new HashSet<>());
        }

        List<SimEvent> generatedEvents = new ArrayList<>();
        int globalEventOrder = 0;

        for (UserSessionInfo session : allSessions) {
            int u = session.userId();
            UserData ud = usersData.get(u - 1);
            if (userEventCounts[u] >= ud.e_u()) {
                continue;
            }

            LocalDateTime sTime = session.time();
            SplittableRandom sRng = session.sessionRng();

            // 1. Tập ứng viên đủ điều kiện: publishedTime <= sTime, chưa download, chưa dismiss
            List<Lut> eligible = new ArrayList<>();
            for (Lut lut : luts) {
                if (lut.getPublishedTime().isAfter(sTime)) {
                    continue;
                }
                int lid = lut.getId();
                if (userDownloaded.get(u).contains(lid) || userDismissed.get(u).contains(lid)) {
                    continue;
                }
                eligible.add(lut);
            }

            if (eligible.isEmpty()) {
                continue;
            }

            // Sắp xếp tìm top 12 phổ biến
            eligible.sort((a, b) -> {
                int cmp = Integer.compare(globalDownloads[b.getId()], globalDownloads[a.getId()]);
                if (cmp != 0) return cmp;
                cmp = b.getPublishedTime().compareTo(a.getPublishedTime());
                if (cmp != 0) return cmp;
                return Integer.compare(a.getId(), b.getId());
            });

            int popCount = Math.min(12, eligible.size());
            List<Lut> seen = new ArrayList<>(24);
            for (int k = 0; k < popCount; k++) {
                seen.add(eligible.get(k));
            }

            // 12 LUT ngẫu nhiên khác
            if (eligible.size() > popCount) {
                List<Lut> remaining = new ArrayList<>(eligible.subList(popCount, eligible.size()));
                int takeRandom = Math.min(12, remaining.size());
                for (int r = 0; r < takeRandom; r++) {
                    int pick = r + sRng.nextInt(remaining.size() - r);
                    Lut chosen = remaining.get(pick);
                    remaining.set(pick, remaining.get(r));
                    remaining.set(r, chosen);
                    seen.add(chosen);
                }
            }

            // 2. Xem v in {1, 2, 3} LUT, rút không hoàn lại theo softmax(U) trên tập thấy
            int v = 1 + sRng.nextInt(3);
            v = Math.min(v, seen.size());

            List<Lut> viewed = new ArrayList<>(v);
            List<Lut> remainingSeen = new ArrayList<>(seen);

            for (int step = 0; step < v; step++) {
                double maxU = Double.NEGATIVE_INFINITY;
                double[] uVals = new double[remainingSeen.size()];
                for (int idx = 0; idx < remainingSeen.size(); idx++) {
                    int lid = remainingSeen.get(idx).getId();
                    double uVal = calculateU(ud, lid, ix, globalDownloads[lid], epsTable[u][lid]);
                    uVals[idx] = uVal;
                    if (uVal > maxU) {
                        maxU = uVal;
                    }
                }

                double sumWeight = 0.0;
                double[] weights = new double[remainingSeen.size()];
                for (int idx = 0; idx < remainingSeen.size(); idx++) {
                    weights[idx] = Math.exp(uVals[idx] - maxU);
                    sumWeight += weights[idx];
                }

                double target = sRng.nextDouble() * sumWeight;
                double running = 0.0;
                int chosenIdx = remainingSeen.size() - 1;
                for (int idx = 0; idx < remainingSeen.size(); idx++) {
                    running += weights[idx];
                    if (running >= target) {
                        chosenIdx = idx;
                        break;
                    }
                }

                viewed.add(remainingSeen.get(chosenIdx));
                remainingSeen.remove(chosenIdx);
            }

            int orderInSession = 0;

            // Xử lý VIEW, PREVIEW, FAVORITE, DOWNLOAD
            for (Lut lut : viewed) {
                if (userEventCounts[u] >= ud.e_u()) break;
                int lid = lut.getId();

                // VIEW
                LocalDateTime eventTime = sTime.plusSeconds(45L * orderInSession);
                generatedEvents.add(new SimEvent(u, "VIEW", lid, eventTime, globalEventOrder++));
                userEventCounts[u]++;
                orderInSession++;

                double uVal = calculateU(ud, lid, ix, globalDownloads[lid], epsTable[u][lid]);

                // PREVIEW: xác suất sigma(2*(U - 1))
                double probPreview = 1.0 / (1.0 + Math.exp(-2.0 * (uVal - 1.0)));
                boolean hasPreviewed = false;
                if (sRng.nextDouble() < probPreview) {
                    if (userEventCounts[u] < ud.e_u()) {
                        LocalDateTime pTime = sTime.plusSeconds(45L * orderInSession);
                        generatedEvents.add(new SimEvent(u, "PREVIEW", lid, pTime, globalEventOrder++));
                        userEventCounts[u]++;
                        orderInSession++;
                        userPreviewed.get(u).add(lid);
                        hasPreviewed = true;
                    }
                }

                // Nếu đã xem trước (hasPreviewed)
                if (hasPreviewed) {
                    // FAVORITE: 0.4 * sigma(2*(U - 1.5))
                    if (!userFavorited.get(u).contains(lid)) {
                        double probFav = 0.4 / (1.0 + Math.exp(-2.0 * (uVal - 1.5)));
                        if (sRng.nextDouble() < probFav && userEventCounts[u] < ud.e_u()) {
                            LocalDateTime fTime = sTime.plusSeconds(45L * orderInSession);
                            generatedEvents.add(new SimEvent(u, "FAVORITE", lid, fTime, globalEventOrder++));
                            userEventCounts[u]++;
                            orderInSession++;
                            userFavorited.get(u).add(lid);
                        }
                    }

                    // DOWNLOAD: 0.6 * sigma(2*(U - 1.5))
                    if (!userDownloaded.get(u).contains(lid)) {
                        double probDown = 0.6 / (1.0 + Math.exp(-2.0 * (uVal - 1.5)));
                        if (sRng.nextDouble() < probDown && userEventCounts[u] < ud.e_u()) {
                            LocalDateTime dTime = sTime.plusSeconds(45L * orderInSession);
                            generatedEvents.add(new SimEvent(u, "DOWNLOAD", lid, dTime, globalEventOrder++));
                            userEventCounts[u]++;
                            orderInSession++;
                            userDownloaded.get(u).add(lid);
                            globalDownloads[lid]++;
                        }
                    }
                }
            }

            // 3. Mỗi LUT thấy mà không xem có U < 0.3: DISMISS xác suất 0.05
            for (Lut lut : remainingSeen) {
                if (userEventCounts[u] >= ud.e_u()) break;
                int lid = lut.getId();
                double uVal = calculateU(ud, lid, ix, globalDownloads[lid], epsTable[u][lid]);
                if (uVal < 0.3) {
                    if (sRng.nextDouble() < 0.05) {
                        LocalDateTime disTime = sTime.plusSeconds(45L * orderInSession);
                        generatedEvents.add(new SimEvent(u, "DISMISS", lid, disTime, globalEventOrder++));
                        userEventCounts[u]++;
                        orderInSession++;
                        userDismissed.get(u).add(lid);
                    }
                }
            }
        }

        // Sắp theo (time, userId, order)
        generatedEvents.sort(Comparator.comparing(SimEvent::time)
                .thenComparingInt(SimEvent::userId)
                .thenComparingInt(SimEvent::order));

        return new SimDataset(luts, simUsers, generatedEvents);
    }

    private static double calculateU(UserData ud, int lutId, LutVectorIndex ix, int currentDownloads, double eps) {
        String itemStyle = ix.style(lutId);
        double styleMatch = (itemStyle != null && ud.preferredStyles.contains(itemStyle)) ? 1.0 : 0.0;

        double[] z = ix.colorZ(lutId);
        double distSq = 0.0;
        for (int d = 0; d < 10; d++) {
            double diff = z[d] - ud.c_u[d];
            distSq += diff * diff;
        }
        double colorMatch = 1.5 * Math.exp(-distSq / 20.0);
        double popMatch = ud.beta_u * Math.log(1.0 + currentDownloads);

        return styleMatch + colorMatch + popMatch + eps;
    }

    public static long mix(long seed, long a, long b) {
        long h = seed ^ (a * 0x9E3779B97F4A7C15L) ^ (b * 0xBF58476D1CE4E5B9L);
        h = (h ^ (h >>> 30)) * 0xBF58476D1CE4E5B9L;
        h = (h ^ (h >>> 27)) * 0x94D049BB133111EBL;
        return h ^ (h >>> 31);
    }

    public static double computeEpsilon(long seed, int u, int i) {
        long pairSeed = mix(seed, u, i);
        SplittableRandom pairRng = new SplittableRandom(pairSeed);
        double u1 = pairRng.nextDouble();
        while (u1 <= 1e-15) {
            u1 = pairRng.nextDouble();
        }
        double u2 = pairRng.nextDouble();
        return 0.3 * Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    }

    private static List<String> sampleStyles(int k, SplittableRandom rng) {
        double total = 0.0;
        for (double w : STYLE_WEIGHTS) total += w;

        double target = rng.nextDouble() * total;
        double running = 0.0;
        int firstIdx = 0;
        for (int i = 0; i < STYLES.size(); i++) {
            running += STYLE_WEIGHTS[i];
            if (running >= target) {
                firstIdx = i;
                break;
            }
        }
        if (k == 1) {
            return List.of(STYLES.get(firstIdx));
        }

        // Rút không hoàn lại phần tử thứ 2
        double remainingTotal = total - STYLE_WEIGHTS[firstIdx];
        double target2 = rng.nextDouble() * remainingTotal;
        running = 0.0;
        int secondIdx = 0;
        for (int i = 0; i < STYLES.size(); i++) {
            if (i == firstIdx) continue;
            running += STYLE_WEIGHTS[i];
            if (running >= target2) {
                secondIdx = i;
                break;
            }
        }
        return List.of(STYLES.get(firstIdx), STYLES.get(secondIdx));
    }
}
