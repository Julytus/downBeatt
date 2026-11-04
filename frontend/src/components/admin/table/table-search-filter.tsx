"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export interface TableSearchFilterOption {
  value: string;
  label: string;
}

export interface TableSearchFilterField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select" | "date";
  options?: TableSearchFilterOption[];
}

export interface TableSearchFilterProps {
  fields: TableSearchFilterField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

const ALL_OPTION_VALUE = "__all__";

export function TableSearchFilter({ fields, values, onChange }: TableSearchFilterProps) {
  const [draftValues, setDraftValues] = React.useState(values);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedValuesRef = React.useRef(values);

  React.useEffect(() => {
    lastEmittedValuesRef.current = values;
    setDraftValues(values);
  }, [values]);

  React.useEffect(() => {
    if (JSON.stringify(draftValues) === JSON.stringify(lastEmittedValuesRef.current)) return;
    timeoutRef.current = setTimeout(() => onChange(draftValues), 400);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [draftValues, onChange]);

  const handleSelectChange = (key: string, value: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const next = { ...draftValues, [key]: value };
    lastEmittedValuesRef.current = next;
    setDraftValues(next);
    onChange(next);
  };

  const clearFilters = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const clearedValues = Object.fromEntries(fields.map(({ key }) => [key, ""]));
    lastEmittedValuesRef.current = clearedValues;
    setDraftValues(clearedValues);
    onChange(clearedValues);
  };

  return (
    <div className="bg-card flex flex-wrap items-end gap-3 rounded-lg border p-4">
      {fields.map((field) => (
        <div key={field.key} className="grid w-full max-w-sm gap-2">
          <label htmlFor={`table-filter-${field.key}`} className="text-sm font-medium">
            {field.label}
          </label>
          {field.type === "select" ? (
            <Select
              value={
                !draftValues[field.key] || draftValues[field.key] === ""
                  ? ALL_OPTION_VALUE
                  : draftValues[field.key]
              }
              onValueChange={(val) =>
                handleSelectChange(field.key, val === ALL_OPTION_VALUE ? "" : val)
              }
            >
              <SelectTrigger id={`table-filter-${field.key}`} className="w-full">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem
                    key={opt.value === "" ? ALL_OPTION_VALUE : opt.value}
                    value={opt.value === "" ? ALL_OPTION_VALUE : opt.value}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === "date" ? (
            <Input
              id={`table-filter-${field.key}`}
              type="date"
              value={draftValues[field.key] ?? ""}
              placeholder={field.placeholder}
              onChange={(event) =>
                setDraftValues((current) => ({ ...current, [field.key]: event.target.value }))
              }
            />
          ) : (
            <Input
              id={`table-filter-${field.key}`}
              type="text"
              value={draftValues[field.key] ?? ""}
              placeholder={field.placeholder}
              onChange={(event) =>
                setDraftValues((current) => ({ ...current, [field.key]: event.target.value }))
              }
            />
          )}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={clearFilters}>
        Xóa lọc
      </Button>
    </div>
  );
}
