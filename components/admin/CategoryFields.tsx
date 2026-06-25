"use client";

import { useState } from "react";
import { CATEGORY_FIELDS, type CategoryField } from "@/lib/admin/category-fields";
import { Input } from "@/components/ui/input";

interface CategoryFieldsProps {
  category: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function CategoryFields({ category, data, onChange }: CategoryFieldsProps) {
  const fields = CATEGORY_FIELDS[category];
  if (!fields) {
    return (
      <p className="text-xs text-muted-foreground">
        No structured fields defined for &quot;{category}&quot;. Use the Advanced JSON editor below.
      </p>
    );
  }

  function update(key: string, value: unknown) {
    onChange({ ...data, [key]: value });
  }

  function getValue(field: CategoryField): unknown {
    const val = data[field.key];
    if (field.type === "boolean") return val === true;
    if (field.type === "tags") {
      return Array.isArray(val) ? val.join(", ") : (val as string) ?? "";
    }
    if (field.type === "json") {
      if (val === undefined || val === null) return "";
      return typeof val === "string" ? val : JSON.stringify(val, null, 2);
    }
    return (val as string) ?? "";
  }

  function handleChange(field: CategoryField, raw: string) {
    if (field.type === "number") {
      const num = parseFloat(raw);
      update(field.key, isNaN(num) ? null : num);
    } else if (field.type === "boolean") {
      update(field.key, raw === "true");
    } else if (field.type === "tags") {
      const arr = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      update(field.key, arr.length > 0 ? arr : null);
    } else {
      update(field.key, raw || null);
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Category Data
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((field) => {
          const id = `cf-${field.key}`;
          const val = getValue(field);

          return (
            <div key={field.key} className={field.type === "textarea" || field.type === "json" ? "sm:col-span-2" : ""}>
              <label htmlFor={id} className="text-xs font-medium text-muted-foreground mb-1 block">
                {field.label}
              </label>

              {field.type === "select" && field.options ? (
                <select
                  id={id}
                  value={String(val)}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">--</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "boolean" ? (
                <select
                  id={id}
                  value={String(val)}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  id={id}
                  value={String(val)}
                  onChange={(e) => handleChange(field, e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder={field.placeholder}
                />
              ) : field.type === "tags" ? (
                <Input
                  id={id}
                  type="text"
                  value={String(val)}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={field.placeholder}
                />
              ) : field.type === "json" ? (
                <textarea
                  id={id}
                  value={String(val)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      update(field.key, parsed);
                    } catch {
                      update(field.key, e.target.value);
                    }
                  }}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder={field.placeholder}
                />
              ) : (
                <Input
                  id={id}
                  type={field.type === "number" ? "number" : "text"}
                  value={field.type === "number" ? (val as number) ?? "" : String(val)}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={field.placeholder}
                  step={field.type === "number" ? "any" : undefined}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
