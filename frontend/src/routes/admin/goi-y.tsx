import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { ConfigTab } from "@/components/admin/recommend/config-tab";
import { EvalTab } from "@/components/admin/recommend/eval-tab";
import { OnlineTab } from "@/components/admin/recommend/online-tab";
import { RebuildIndexDialog } from "@/components/admin/recommend/rebuild-index-dialog";
import { TryProfileTab } from "@/components/admin/recommend/try-profile-tab";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCanView } from "@/hooks/use-can-view";
import { rebuildIndexMutationOptions } from "@/lib/tanstack/options/recommend-admin";
import type { FeatureFailureDTO } from "@/lib/types/recommend";

const RESOURCE_CODE = "RECOMMEND";

const VALID_SCENARIOS = [
  "standard",
  "all",
  "cold-user-0",
  "cold-user-1",
  "cold-user-3",
  "cold-user-5"
] as const;

export type ValidScenario = (typeof VALID_SCENARIOS)[number];

const searchSchema = z.object({
  tab: z.enum(["cau-hinh", "danh-gia", "truc-tuyen", "thu-ho-so"]).catch("cau-hinh"),
  scen: z.enum(VALID_SCENARIOS).catch("standard"),
  algo: z.string().optional().catch(undefined),
  k: z.coerce
    .number()
    .refine((val): val is 5 | 10 | 20 => val === 5 || val === 10 || val === 20)
    .default(10)
    .catch(10),
  page: z.coerce.number().int().positive().default(1).catch(1),
  a: z.coerce.number().int().positive().optional().catch(undefined),
  b: z.coerce.number().int().positive().optional().catch(undefined)
});

export const Route = createFileRoute("/admin/goi-y")({
  validateSearch: searchSchema,
  component: GoiYRoute
});

function GoiYRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <GoiYPage />
    </AdminPermissionGuard>
  );
}

function GoiYPage() {
  const search = Route.useSearch();
  const { tab } = search;
  const navigate = Route.useNavigate();
  const { can } = useCanView();
  const canUpdate = can(RESOURCE_CODE, "UPDATE");

  const [rebuildDialogOpen, setRebuildDialogOpen] = useState(false);
  const [featureFailed, setFeatureFailed] = useState<FeatureFailureDTO[]>([]);

  const rebuildMutation = useMutation({
    ...rebuildIndexMutationOptions,
    onSuccess: (data) => {
      setRebuildDialogOpen(false);
      toast.success(`Đã tính lại chỉ mục (${data.lutCount} LUT, ${data.elapsedMs} ms)`);
      if (data.featureFailed && data.featureFailed.length > 0) {
        setFeatureFailed(data.featureFailed);
      } else {
        setFeatureFailed([]);
      }
    },
    onError: () => {
      setRebuildDialogOpen(false);
    }
  });

  const handleTabChange = (nextTab: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        tab: nextTab as "cau-hinh" | "danh-gia" | "truc-tuyen" | "thu-ho-so"
      }),
      replace: true
    });
  };

  return (
    <div className="container mx-auto flex flex-col gap-6 p-6 w-full min-w-0 max-w-full">
      {/* Tiêu đề trang + nút Tính lại chỉ mục */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gợi ý</h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình thuật toán, hiệu quả trên cửa hàng và công cụ thử hồ sơ khách hàng.
          </p>
        </div>
        {canUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRebuildDialogOpen(true)}
          >
            <RefreshCw className="mr-2 size-4" />
            Tính lại chỉ mục
          </Button>
        )}
      </div>

      {/* Cảnh báo khi có LUT không đo được đặc trưng màu sau tính lại */}
      {featureFailed.length > 0 && (
        <Alert variant="destructive" className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <AlertTitle>
              Không đo được đặc trưng màu của {featureFailed.length} LUT
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-1 mt-1">
              {featureFailed.map((f) => (
                <div key={f.id}>
                  {f.title}: {f.error}
                </div>
              ))}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFeatureFailed([])}
            className="text-destructive hover:text-destructive ml-4"
          >
            Đóng
          </Button>
        </Alert>
      )}

      {/* 4 Thẻ nội dung */}
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6 w-full min-w-0">
        <div className="max-w-full overflow-x-auto pb-1">
          <TabsList>
            <TabsTrigger value="cau-hinh">Cấu hình</TabsTrigger>
            <TabsTrigger value="danh-gia">Đánh giá</TabsTrigger>
            <TabsTrigger value="truc-tuyen">Trực tuyến</TabsTrigger>
            <TabsTrigger value="thu-ho-so">Thử hồ sơ</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cau-hinh" className="w-full min-w-0">
          <ConfigTab />
        </TabsContent>
        <TabsContent value="danh-gia" className="w-full min-w-0">
          <EvalTab
            scen={search.scen}
            algo={search.algo}
            k={search.k}
            page={search.page}
            a={search.a}
            b={search.b}
            onScenarioChange={(scen) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  scen: scen as ValidScenario,
                  page: 1
                }),
                replace: true
              })
            }
            onAlgoChange={(algo) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  algo: algo || undefined,
                  page: 1
                }),
                replace: true
              })
            }
            onKChange={(k) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  k
                }),
                replace: true
              })
            }
            onPageChange={(page) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  page
                }),
                replace: true
              })
            }
            onCompare={(a, b) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  a,
                  b
                }),
                replace: true
              })
            }
            onCloseCompare={() =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  a: undefined,
                  b: undefined
                }),
                replace: true
              })
            }
          />
        </TabsContent>
        <TabsContent value="truc-tuyen" className="w-full min-w-0">
          <OnlineTab />
        </TabsContent>
        <TabsContent value="thu-ho-so" className="w-full min-w-0">
          <TryProfileTab />
        </TabsContent>
      </Tabs>

      <RebuildIndexDialog
        open={rebuildDialogOpen}
        onOpenChange={setRebuildDialogOpen}
        isLoading={rebuildMutation.isPending}
        onConfirm={() => rebuildMutation.mutate()}
      />
    </div>
  );
}
