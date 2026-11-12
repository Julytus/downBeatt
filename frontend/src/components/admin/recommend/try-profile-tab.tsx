import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { tryProfileMutationOptions } from "@/lib/tanstack/options/recommend-admin";
import { getServerErrorMessage } from "@/lib/types/common";
import type {
  CustomerOptionDTO,
  TryProfileRequest,
  TryProfileResultDTO
} from "@/lib/types/recommend";
import { CustomerCombobox } from "./customer-combobox";
import { ProfileCard } from "./profile-card";
import { TabLoadError } from "./tab-load-error";
import { TryItemsTable } from "./try-items-table";

export function TryProfileTab() {
  const [clientType, setClientType] = React.useState<"account" | "anon">("account");
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerOptionDTO | null>(null);
  const [anonId, setAnonId] = React.useState("");
  const [inputError, setInputError] = React.useState<string | null>(null);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<TryProfileResultDTO | null>(null);
  const [lastRequest, setLastRequest] = React.useState<TryProfileRequest | null>(null);

  const tryProfileMutation = useMutation({
    ...tryProfileMutationOptions,
    onSuccess: (data) => {
      setResult(data);
      setInputError(null);
      setGeneralError(null);
    },
    onError: (err) => {
      setResult(null);
      const status = err.response?.status;
      const msg = getServerErrorMessage(err) ?? "Không kết nối được máy chủ";
      if (status && status < 500) {
        setInputError(msg);
        setGeneralError(null);
      } else {
        setInputError(null);
        setGeneralError(msg);
      }
    }
  });

  const handleSelectCustomer = (customer: CustomerOptionDTO) => {
    setSelectedCustomer(customer);
    setInputError(null);
    setGeneralError(null);
    const req: TryProfileRequest = { userId: customer.id };
    setLastRequest(req);
    tryProfileMutation.mutate(req);
  };

  const handleViewAnonProfile = () => {
    if (!anonId.trim()) return;
    setInputError(null);
    setGeneralError(null);
    const req: TryProfileRequest = { anonId: anonId.trim() };
    setLastRequest(req);
    tryProfileMutation.mutate(req);
  };

  const handleRetry = () => {
    if (lastRequest) {
      setGeneralError(null);
      tryProfileMutation.mutate(lastRequest);
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Chọn loại khách */}
      <div className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
        <div className="space-y-2">
          <Label id="client-type-label">Loại khách</Label>
          <RadioGroup
            aria-labelledby="client-type-label"
            value={clientType}
            onValueChange={(val) => {
              setClientType(val as "account" | "anon");
              setInputError(null);
              setResult(null);
            }}
            className="flex items-center gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="account" id="client-account" />
              <Label htmlFor="client-account" className="cursor-pointer">
                Tài khoản
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="anon" id="client-anon" />
              <Label htmlFor="client-anon" className="cursor-pointer">
                Mã ẩn danh
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Form nhập tương ứng */}
        {clientType === "account" ? (
          <CustomerCombobox
            selectedCustomer={selectedCustomer}
            onSelectCustomer={handleSelectCustomer}
            disabled={tryProfileMutation.isPending}
            error={inputError}
          />
        ) : (
          <div className="space-y-1.5 max-w-lg">
            <Label htmlFor="anon-id-input">Mã ẩn danh (anonId)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="anon-id-input"
                placeholder="VD: 3f2b8c1e-9d4a-4f6b-8a2e-1c7d5e9f0a3b"
                value={anonId}
                onChange={(e) => {
                  setAnonId(e.target.value);
                  setInputError(null);
                }}
                aria-invalid={!!inputError}
                aria-describedby={inputError ? "anon-id-error" : undefined}
                className="flex-1"
              />
              <Button
                type="button"
                disabled={!anonId.trim() || tryProfileMutation.isPending}
                onClick={handleViewAnonProfile}
              >
                Xem hồ sơ
              </Button>
            </div>
            {inputError && (
              <p id="anon-id-error" className="text-sm font-medium text-destructive">
                {inputError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Trạng thái đang tải */}
      {tryProfileMutation.isPending && (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      )}

      {/* Lỗi 5xx hoặc mạng */}
      {!tryProfileMutation.isPending && generalError && (
        <TabLoadError onRetry={handleRetry} />
      )}

      {/* Chưa chọn khách hàng nào */}
      {!tryProfileMutation.isPending && !generalError && !result && (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>
                Chọn một khách hàng để xem hồ sơ và 12 gợi ý của họ.
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      {/* Kết quả hồ sơ + danh sách gợi ý */}
      {!tryProfileMutation.isPending && !generalError && result && (
        <div className="space-y-6 w-full min-w-0">
          <ProfileCard data={result} />
          <TryItemsTable
            items={result.items}
            strategy={result.strategy}
            categoryNames={result.categoryNames}
          />
        </div>
      )}
    </div>
  );
}
