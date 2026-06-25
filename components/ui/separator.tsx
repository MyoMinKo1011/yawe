"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface SeparatorProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
}

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <hr
      className={cn(
        "border-border",
        orientation === "horizontal" ? "w-full border-t" : "h-full border-l",
        className
      )}
      {...props}
    />
  );
}
