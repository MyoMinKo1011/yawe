"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { DynamicRenderer, type DynamicRendererAction } from "@/components/chat/DynamicRenderer";
import { Avatar } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  displayName?: string | null;
  avatarUrl?: string | null;
  onAction?: (action: DynamicRendererAction) => void;
  disabled?: boolean;
}

function tryParseJsonContent(content: string): {
  components: Array<{ type: string; props: Record<string, unknown> }>;
  places: Array<Record<string, unknown>>;
} | null {
  const trimmed = content?.trim();
  if (!trimmed) return null;

  try {
    let json = trimmed;
    if (json.startsWith("```")) {
      json = json.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    }
    const jsonMatch = json.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || json);

    if (parsed.ui_components && Array.isArray(parsed.ui_components)) {
      return {
        components: parsed.ui_components.map((c: Record<string, unknown>) => ({
          type: typeof c.type === "string" ? c.type : "text",
          props: c.props && typeof c.props === "object" ? c.props as Record<string, unknown> : {},
        })),
        places: Array.isArray(parsed.places) ? parsed.places : [],
      };
    }

    if (!parsed.ui_components && !parsed.reply) return null;

    return null;
  } catch {
    return null;
  }
}

function extractComponents(msg: ChatMessageType): {
  components: Array<{ type: string; props: Record<string, unknown> }>;
  places: Array<Record<string, unknown>>;
} {
  try {
    const meta = msg.metadata as Record<string, unknown> | null;
    const comps = meta?.ui_components as Array<{ type: string; props: Record<string, unknown> }> | undefined;
    const places = meta?.places as Array<Record<string, unknown>> | undefined;

    if (comps?.length) {
      const allText = comps.every((c) => c.type === "text" || !c.type);
      if (allText) {
        const content = msg.content || "";
        if (content.startsWith("{") || content.startsWith("```")) {
          const reparsed = tryParseJsonContent(content);
          if (reparsed && reparsed.components.length > 0) {
            return reparsed;
          }
        }
      }
      return { components: comps, places: places ?? [] };
    }
  } catch {
    // fallback
  }

  const content = msg.content || "";
  const reparsed = tryParseJsonContent(content);
  if (reparsed) return reparsed;

  return {
    components: [{ type: "text", props: { content: content || "..." } }],
    places: [],
  };
}

export function ChatMessage({ message, displayName, avatarUrl, onAction, disabled }: ChatMessageProps) {
  const isUser = message.role === "user";
  const { components, places } = isUser
    ? { components: [], places: [] }
    : extractComponents(message);

  return (
    <div className={cn("flex gap-2.5 sm:gap-3 animate-fade-in", isUser && "flex-row-reverse")}>
      <div className={cn("h-7 w-7 sm:h-8 sm:w-8 shrink-0 mt-0.5", isUser ? "overflow-hidden rounded-full" : "")}>
        {isUser ? (
          <Avatar
            src={avatarUrl}
            fallback={displayName ?? undefined}
            size="sm"
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
        )}
      </div>
      <div className={cn("flex-1 min-w-0", isUser && "flex flex-col items-end")}>
        {isUser ? (
          <div className="bg-muted rounded-2xl rounded-tr-md px-3 sm:px-4 py-2 max-w-[85%] sm:max-w-[75%]">
            <p className="text-sm break-words leading-relaxed">{message.content}</p>
          </div>
        ) : (
          <div className="min-w-0 max-w-full">
            <DynamicRenderer components={components as never} places={places as never} onAction={onAction} disabled={disabled} />
          </div>
        )}
      </div>
    </div>
  );
}
