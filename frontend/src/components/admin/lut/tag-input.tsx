import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeTag } from "@/lib/lut-admin/tag-utils";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagInput({ value = [], onChange, disabled }: TagInputProps) {
  const [inputText, setInputText] = React.useState("");
  const [error, setError] = React.useState("");

  const tryAddTag = (raw: string): boolean => {
    if (raw.length > 50) {
      setError("Mỗi thẻ tối đa 50 ký tự");
      return false;
    }

    const normalized = normalizeTag(raw);
    if (!normalized) {
      return false;
    }

    if (value.includes(normalized)) {
      setError("");
      return true;
    }

    if (value.length >= 20) {
      setError("Tối đa 20 thẻ");
      return false;
    }

    onChange([...value, normalized]);
    setError("");
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputText.trim()) {
        if (tryAddTag(inputText)) {
          setInputText("");
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",")) {
      const parts = val.split(",");
      const toAdd = parts.slice(0, -1);
      const remaining = parts[parts.length - 1];

      let anyAdded = false;
      for (const p of toAdd) {
        if (p.trim()) {
          if (tryAddTag(p)) {
            anyAdded = true;
          }
        }
      }
      if (anyAdded || toAdd.length > 0) {
        setInputText(remaining);
      }
    } else {
      setInputText(val);
      if (error) {
        setError("");
      }
    }
  };

  const handleRemove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="lut-tags">Thẻ</Label>
        <span className="text-xs text-muted-foreground">
          Cần ít nhất 3 thẻ để xuất bản
        </span>
      </div>

      <Input
        id="lut-tags"
        role="textbox"
        name="Thẻ"
        aria-label="Thẻ"
        placeholder="Gõ thẻ rồi nhấn Enter"
        value={inputText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-invalid={!!error}
      />
      <FieldError>{error}</FieldError>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-normal"
            >
              <span>{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Xoá thẻ ${tag}`}
                  onClick={() => handleRemove(tag)}
                  className="rounded-full hover:bg-muted-foreground/20 p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
