"use client";

import { useCallback } from "react";
import { DriverPanel } from "@/components/DriverPanel";
import { EmotionPanel } from "@/components/EmotionPanel";
import { HistoryChart } from "@/components/HistoryChart";
import { InputPanel } from "@/components/InputPanel";
import { PreferencesPanel } from "@/components/PreferencesPanel";
import { RoomPreview } from "@/components/RoomPreview";
import { useLightingSystem } from "@/hooks/useLightingSystem";
import type { Emotion } from "@/lib/client-types";

export default function HomePage() {
  const { snapshot, error, submitEmotion, submitText, updatePreferences, selectDriver } = useLightingSystem();

  const onCamera = useCallback((emotion: Emotion, confidence: number) => submitEmotion(emotion, confidence, "camera"), [submitEmotion]);
  const onManual = useCallback((emotion: Emotion) => submitEmotion(emotion, 1, "manual"), [submitEmotion]);

  if (!snapshot) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-zinc-400">
        {error ? `Could not reach the lighting service: ${error}` : "Connecting to the lighting service…"}
      </main>
    );
  }

  const { state, preferences, history, driver, drivers, lastApply } = snapshot;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Emotion-Responsive Smart Lighting</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Illumination that adapts to how you feel, for a personalised and immersive space.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Output: {driver.name}
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <RoomPreview state={state} />
          <InputPanel current={state.emotion} onCamera={onCamera} onText={submitText} onManual={onManual} />
          <HistoryChart history={history} />
        </div>
        <div className="flex flex-col gap-4">
          <EmotionPanel state={state} />
          <DriverPanel active={driver} drivers={drivers} lastApply={lastApply} onSelect={selectDriver} />
        </div>
      </div>

      <div className="mt-4">
        <PreferencesPanel preferences={preferences} onChange={updatePreferences} />
      </div>

      <footer className="mt-8 text-center text-xs text-zinc-600">
        Camera analysis runs entirely in your browser. Readings are kept in memory on the server only.
      </footer>
    </main>
  );
}
