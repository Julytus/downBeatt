import {
  EVAL_ABLATION_ALGORITHMS,
  EVAL_ALGORITHM_LABELS,
  EVAL_BASELINE_ALGORITHMS,
  EVAL_COLD_ALGORITHMS,
  EVAL_CONCLUSION_LABELS,
  EVAL_METRICS,
  formatMeanStd,
  formatMetricValue,
  formatPValue,
  formatSignedDiff,
  formatSignedPercent,
  formatSignedPercentChange
} from "@/components/admin/recommend/labels";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import type {
  EvalMetricStatDTO,
  EvalScenarioSummaryDTO,
  EvalSummaryDTO
} from "@/lib/types/recommend";

export function getMetricStat(
  summary: EvalSummaryDTO,
  scenarioName: string,
  algorithm: string,
  k: number | string,
  metricKey: string
): EvalMetricStatDTO | undefined {
  const scen = summary.scenarios.find((s) => s.scenario === scenarioName);
  const row = scen?.rows.find((r) => r.algorithm === algorithm);
  return row?.metrics[String(k)]?.[metricKey];
}

export function getColdScenarios(summary: EvalSummaryDTO): EvalScenarioSummaryDTO[] {
  return summary.scenarios
    .filter((s) => s.scenario.startsWith("cold-user-"))
    .sort((a, b) => {
      const nA = parseInt(a.scenario.replace("cold-user-", ""), 10);
      const nB = parseInt(b.scenario.replace("cold-user-", ""), 10);
      return nA - nB;
    });
}

export interface SummaryCardsProps {
  summary: EvalSummaryDTO;
  k: number;
}

export function SummaryCards({ summary, k }: SummaryCardsProps) {
  const standardScen = summary.scenarios.find((s) => s.scenario === "standard");
  const baselineRows = EVAL_BASELINE_ALGORITHMS.filter((algo) =>
    standardScen?.rows.some((r) => r.algorithm === algo)
  );

  const t0 = summary.tests[0];
  const hasTests = summary.tests.length > 0;

  const hasVariants = standardScen?.rows.some((r) => r.algorithm.startsWith("m-"));
  const ablationRows = EVAL_ABLATION_ALGORITHMS.filter((algo) =>
    standardScen?.rows.some((r) => r.algorithm === algo)
  );

  const coldScenarios = getColdScenarios(summary);
  const coldAlgos = EVAL_COLD_ALGORITHMS.filter((algo) =>
    coldScenarios.some((sc) => sc.rows.some((r) => r.algorithm === algo))
  );

  const baselineMetrics = EVAL_METRICS.slice(0, 8);

  return (
    <>
      {/* Card 1: So sánh với baseline */}
      <Card>
        <CardHeader>
          <CardTitle>So sánh với baseline</CardTitle>
          <CardDescription>
            {`Kịch bản chính, K = ${k}. Người được tính mỗi hạt giống: ${standardScen?.userCounts.join(", ") ?? ""}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thuật toán</TableHead>
                {baselineMetrics.map((m) => (
                  <TableHead key={m.key} className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-block">
                          {m.header(k)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{m.tooltip}</TooltipContent>
                    </Tooltip>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {baselineRows.map((algo) => (
                <TableRow key={algo}>
                  <TableCell className="font-medium">
                    {EVAL_ALGORITHM_LABELS[algo] ?? algo}
                  </TableCell>
                  {baselineMetrics.map((m) => {
                    const st = getMetricStat(summary, "standard", algo, k, m.key);
                    return (
                      <TableCell key={m.key} className="text-right">
                        {formatMeanStd(st, m.digits)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Card 2: Kiểm định thống kê */}
      <Card>
        <CardHeader>
          <CardTitle>Kiểm định thống kê</CardTitle>
          {hasTests && (
            <CardDescription>
              {`NDCG@${t0.k}, Wilcoxon có dấu theo cặp trên ${t0.pairCount} cặp (hạt giống, người dùng), hiệu chỉnh Holm cho ${
                (t0.params?.holmFamilySize as number) ?? 9
              } phép so sánh, mức ý nghĩa ${formatMetricValue(
                Number(t0.params?.alpha ?? 0.05),
                2
              )}. Khoảng tin cậy 95% bằng bootstrap ${
                (t0.params?.bootstrap as number) ?? 1000
              } lần.`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={hasTests ? "p-0" : "py-6 text-center text-sm text-muted-foreground"}>
          {hasTests ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>So sánh</TableHead>
                  <TableHead className="text-right">Chênh lệch trung bình</TableHead>
                  <TableHead className="text-right">Khoảng tin cậy 95%</TableHead>
                  <TableHead className="text-right">Thay đổi tương đối</TableHead>
                  <TableHead className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-block">p (Holm)</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Giá trị p của kiểm định Wilcoxon sau hiệu chỉnh Holm; nhỏ hơn mức ý nghĩa thì chênh lệch có ý nghĩa thống kê
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-right">Kết luận</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.tests.map((t) => {
                  const badgeVariant =
                    t.conclusion === "better"
                      ? "default"
                      : t.conclusion === "worse"
                        ? "destructive"
                        : "secondary";
                  return (
                    <TableRow key={`${t.algorithmA}-${t.algorithmB}`}>
                      <TableCell className="font-medium">
                        {`M với ${EVAL_ALGORITHM_LABELS[t.algorithmB] ?? t.algorithmB}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatSignedDiff(t.meanDiff, 4)}
                      </TableCell>
                      <TableCell className="text-right">
                        {`[${formatSignedDiff(t.ciLow, 4)}; ${formatSignedDiff(t.ciHigh, 4)}]`}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatSignedPercent(t.relChange)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPValue(t.pHolm)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={badgeVariant}>
                          {EVAL_CONCLUSION_LABELS[t.conclusion] ?? t.conclusion}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            "Lô này chưa có kiểm định thống kê."
          )}
        </CardContent>
      </Card>

      {/* Card 3: Bỏ bớt thành phần */}
      <Card>
        <CardHeader>
          <CardTitle>Bỏ bớt thành phần</CardTitle>
          <CardDescription>
            {`Kịch bản chính, K = ${k}. Thay đổi tính trên NDCG trung bình so với M; p lấy từ kiểm định NDCG@10.`}
          </CardDescription>
        </CardHeader>
        <CardContent className={hasVariants ? "p-0" : "py-6 text-center text-sm text-muted-foreground"}>
          {hasVariants ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Biến thể</TableHead>
                  <TableHead className="text-right">{`NDCG@${k}`}</TableHead>
                  <TableHead className="text-right">Thay đổi so với M</TableHead>
                  <TableHead className="text-right">{`ILD@${k}`}</TableHead>
                  <TableHead className="text-right">p (Holm)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ablationRows.map((algo) => {
                  const isM = algo === "cbf-full";
                  const ndcgStat = getMetricStat(summary, "standard", algo, k, "ndcg");
                  const ildStat = getMetricStat(summary, "standard", algo, k, "ild");
                  const mNdcgStat = getMetricStat(summary, "standard", "cbf-full", k, "ndcg");
                  const test = summary.tests.find((t) => t.algorithmB === algo);

                  const changePercent =
                    isM || !mNdcgStat || !ndcgStat
                      ? "—"
                      : formatSignedPercentChange(mNdcgStat.mean, ndcgStat.mean);

                  const pHolmText = isM || !test ? "—" : formatPValue(test.pHolm);

                  return (
                    <TableRow key={algo}>
                      <TableCell className="font-medium">
                        {EVAL_ALGORITHM_LABELS[algo] ?? algo}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMeanStd(ndcgStat, 4)}
                      </TableCell>
                      <TableCell className="text-right">{changePercent}</TableCell>
                      <TableCell className="text-right">
                        {formatMeanStd(ildStat, 4)}
                      </TableCell>
                      <TableCell className="text-right">{pHolmText}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            "Lô này không có biến thể bỏ bớt."
          )}
        </CardContent>
      </Card>

      {/* Card 4: Người mới */}
      <Card>
        <CardHeader>
          <CardTitle>Người mới</CardTitle>
          {coldScenarios.length > 0 && (
            <CardDescription>
              {`NDCG@${k} khi người dùng chỉ có sở thích khai báo và n sự kiện đầu tiên. Người có khai báo được tính mỗi hạt giống: ${coldScenarios[0].userCounts.join(", ")}.`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={coldScenarios.length > 0 ? "p-0" : "py-6 text-center text-sm text-muted-foreground"}>
          {coldScenarios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thuật toán</TableHead>
                  {coldScenarios.map((sc) => (
                    <TableHead key={sc.scenario} className="text-right">
                      {`n = ${sc.scenario.replace("cold-user-", "")}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {coldAlgos.map((algo) => (
                  <TableRow key={algo}>
                    <TableCell className="font-medium">
                      {EVAL_ALGORITHM_LABELS[algo] ?? algo}
                    </TableCell>
                    {coldScenarios.map((sc) => {
                      const st = getMetricStat(summary, sc.scenario, algo, k, "ndcg");
                      return (
                        <TableCell key={sc.scenario} className="text-right">
                          {formatMeanStd(st, 4)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            "Lô này không có kịch bản người mới."
          )}
        </CardContent>
      </Card>

      {/* Card 5: LUT mới */}
      <Card>
        <CardHeader>
          <CardTitle>LUT mới</CardTitle>
          <CardDescription>
            {summary.newLutDays !== undefined
              ? `Kịch bản chính, K = ${k}. LUT mới là LUT xuất bản trong ${summary.newLutDays} ngày trước t0.`
              : `Kịch bản chính, K = ${k}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thuật toán</TableHead>
                <TableHead className="text-right">Tỉ lệ danh sách có LUT mới</TableHead>
                <TableHead className="text-right">{`Recall@${k} trên LUT mới`}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baselineRows.map((algo) => {
                const hitStat = getMetricStat(summary, "standard", algo, k, "newLutHit");
                const recallStat = getMetricStat(summary, "standard", algo, k, "newLutRecall");
                return (
                  <TableRow key={algo}>
                    <TableCell className="font-medium">
                      {EVAL_ALGORITHM_LABELS[algo] ?? algo}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMeanStd(hitStat, 4)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMeanStd(recallStat, 4)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
