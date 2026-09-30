"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DriverId, Emotion, EmotionSource, SystemSnapshot, UserPreferences } from "@/lib/client-types";

const POLL_MS = 2000;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
  return data;
}

export function useLightingSystem() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await request<SystemSnapshot>("/api/state"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      if (!busy.current && document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      busy.current = true;
      try {
        await fn();
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        busy.current = false;
      }
    },
    [refresh],
  );

  const submitEmotion = useCallback(
    (emotion: Emotion, confidence: number, source: EmotionSource) =>
      run(() => request("/api/emotion", { method: "POST", body: JSON.stringify({ emotion, confidence, source }) })),
    [run],
  );

  const submitText = useCallback(
    (text: string) => run(() => request("/api/emotion", { method: "POST", body: JSON.stringify({ text }) })),
    [run],
  );

  const updatePreferences = useCallback(
    (update: Partial<UserPreferences>) =>
      run(() => request("/api/preferences", { method: "PUT", body: JSON.stringify(update) })),
    [run],
  );

  const selectDriver = useCallback(
    (id: DriverId) => run(() => request("/api/drivers", { method: "PUT", body: JSON.stringify({ id }) })),
    [run],
  );

  return { snapshot, error, submitEmotion, submitText, updatePreferences, selectDriver, refresh };
}
