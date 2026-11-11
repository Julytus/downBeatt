import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createRecommendCustomersQueryOptions } from "@/lib/tanstack/options/recommend-admin";
import type { CustomerOptionDTO } from "@/lib/types/recommend";
import { cn } from "@/lib/utils";

export interface CustomerComboboxProps {
  selectedCustomer: CustomerOptionDTO | null;
  onSelectCustomer: (customer: CustomerOptionDTO) => void;
  disabled?: boolean;
  error?: string | null;
}

export function CustomerCombobox({
  selectedCustomer,
  onSelectCustomer,
  disabled,
  error
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedKeyword, setDebouncedKeyword] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: customers, isLoading } = useQuery({
    ...createRecommendCustomersQueryOptions(debouncedKeyword || undefined),
    enabled: open
  });

  const handleSelect = (customer: CustomerOptionDTO) => {
    onSelectCustomer(customer);
    setOpen(false);
  };

  const displayText = selectedCustomer
    ? `${selectedCustomer.name} · ${selectedCustomer.email}`
    : "Chọn khách hàng";

  return (
    <div className="space-y-1.5">
      <Label htmlFor="customer-combobox">Khách hàng</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="customer-combobox"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!error}
            aria-describedby={error ? "customer-combobox-error" : undefined}
            variant="outline"
            disabled={disabled}
            className="w-full sm:w-[360px] justify-between font-normal text-left"
          >
            <span className="truncate">{displayText}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full sm:w-[360px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm theo email hoặc tên…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Đang tìm…
                </div>
              ) : !customers || customers.length === 0 ? (
                <CommandEmpty>Không tìm thấy khách hàng</CommandEmpty>
              ) : (
                <CommandGroup>
                  {customers.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <CommandItem
                        key={c.id}
                        value={`${c.id}`}
                        onSelect={() => handleSelect(c)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">
                          {c.name} · {c.email}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p id="customer-combobox-error" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
