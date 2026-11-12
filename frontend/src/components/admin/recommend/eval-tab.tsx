import { useQuery } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";

import { EvalCompareCard } from "@/components/admin/recommend/eval-compare-card";
import { EvalRunsTable } from "@/components/admin/recommend/eval-runs-table";
import { TabLoadError } from "@/components/admin/recommend/tab-load-error";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { createEvalRunsQueryOptions } from "@/lib/tanstack/options/recommend-admin";

export interface EvalTabProps {
  scen?: string;
  algo?: string;
  k?: number;
  page?: number;
  a?: number;
  b?: number;
  onScenarioChange?: (scen: string) => void;
  onAlgoChange?: (algo: string) => void;
  onKChange?: (k: number) => void;
  onPageChange?: (page: number) => void;
  onCompare?: (a: number, b: number) => void;
  onCloseCompare?: () => void;
}

export function EvalTab({
  scen = "standard",
  algo = "",
  k = 10,
  page = 1,
  a,
  b,
  onScenarioChange = () => {},
  onAlgoChange = () => {},
  onKChange = () => {},
  onPageChange = () => {},
  onCompare = () => {},
  onCloseCompare = () => {}
}: EvalTabProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    const ids: number[] = [];
    if (a) ids.push(a);
    if (b && !ids.includes(b)) ids.push(b);
    return ids;
  });

  useEffect(() => {
    if (a && b) {
      setSelectedIds((prev) => {
        if (prev.length === 2 && prev[0] === a && prev[1] === b) return prev;
        return [a, b];
      });
    } else if (!a && !b) {
      setSelectedIds([]);
    }
  }, [a, b]);

  const scenario = scen === "all" ? undefined : scen;
  const { data, isLoading, isError, refetch } = useQuery(
    createEvalRunsQueryOptions({
      algorithm: algo || undefined,
      scenario: scenario || undefined,
      page
    })
  );

  if (isError) {
    return <TabLoadError onRetry={() => void refetch()} />;
  }

  const isMainScenario = !scen || scen === "standard" || scen === "all";
  if (!isLoading && data?.total === 0 && !algo && isMainScenario) {
    return (
      <div className="py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FlaskConical className="size-6 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Chưa có lần chạy đánh giá nào</EmptyTitle>
            <EmptyDescription>
              Chạy trình đánh giá offline (profile eval) để có Precision, Recall,
              NDCG và độ đa dạng của từng thuật toán.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const handleCompareClick = () => {
    if (selectedIds.length === 2) {
      onCompare(selectedIds[0], selectedIds[1]);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      <EvalRunsTable
        runs={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        scen={scen}
        algo={algo}
        k={k}
        selectedIds={selectedIds}
        onScenarioChange={onScenarioChange}
        onAlgoChange={onAlgoChange}
        onKChange={onKChange}
        onPageChange={onPageChange}
        onSelectChange={setSelectedIds}
        onCompare={handleCompareClick}
        isLoading={isLoading}
      />

      {a !== undefined && b !== undefined && (
        <EvalCompareCard
          aId={a}
          bId={b}
          k={k}
          onClose={onCloseCompare}
        />
      )}
    </div>
  );
}
