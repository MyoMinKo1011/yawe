"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionCreated = useRef(false);

  const startNewSession = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title: "New conversation",
        })
        .select()
        .single();

      if (data) {
        setSessionId(data.id);
        setMessages([]);
        setError(null);
      }
    } catch {
      setError("စကားပြောခန်း စတင်၍မရပါ။");
    }
  }, []);

  useEffect(() => {
    if (!sessionCreated.current) {
      sessionCreated.current = true;
      startNewSession();
    }
  }, [startNewSession]);

  const sendMessage = useCallback(
    async (message: string, lat?: number, lng?: number) => {
      if (!sessionId || !message.trim()) return;

      const tempUserMsg: ChatMessage = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "user",
        content: message,
        metadata: { lat, lng },
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            session_id: sessionId,
            lat,
            lng,
          }),
        });

        if (!res.ok) throw new Error("Chat failed");

        const data = await res.json();

        const reply = typeof data.reply === "string" ? data.reply : "";
        const rawComponents = Array.isArray(data.ui_components) ? data.ui_components : [];
        const places = Array.isArray(data.places) ? data.places : [];

        const components = rawComponents.length > 0
          ? rawComponents.map((c: Record<string, unknown>) => {
              const type = c.type || "text";
              const props = c.props && typeof c.props === "object" ? c.props : {};
              return { type, props };
            })
          : [{ type: "text" as const, props: { content: reply || "..." } }];

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: "assistant",
          content: reply,
          metadata: { ui_components: components, places },
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const reason = err instanceof Error ? err.message : "တစ်ခုခုမှားယွင်းသွားပါသည်။";
        setError(reason);
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: "assistant",
          content: "ဝမ်းနည်းပါသည်။ တစ်ခုခုမှားယွင်းသွားပါသည်။",
          metadata: {
            ui_components: [{ type: "text", props: { content: "ဝမ်းနည်းပါသည်။ တစ်ခုခုမှားယွင်းသွားပါသည်။" } }],
          },
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  return {
    messages,
    loading,
    error,
    sessionId,
    sendMessage,
    startNewSession,
  };
}
