"use client";

import { useState } from "react";
import { EMOTIONS } from "@/lib/emotion/types";
import { DEFAULT_PROFILES } from "@/lib/lighting/profiles";
import type { Emotion, UserPreferences } from "@/lib/client-types";

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-300">{label}</span>
        <span className="text-zinc-500">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

/** Personalisation controls: response behaviour, quiet hours and per-emotion scene overrides. */
export function PreferencesPanel({
  preferences,
  onChange,
}: {
  preferences: UserPreferences;
  onChange: (update: Partial<UserPreferences>) => Promise<void>;
}) {
  const [emotion, setEmotion] = useState<Emotion>("happy");
  const override = preferences.overrides[emotion] ?? {};
  const base = DEFAULT_PROFILES[emotion];
  const hue = override.color?.h ?? base.color.h;
  const brightness = override.brightness ?? base.brightness;

  const setOverride = (patch: { h?: number; brightness?: number; name?: string } | null) => {
    const next = { ...preferences.overrides };
    if (patch === null) {
      next[emotion] = undefined;
    } else {
      const existing = next[emotion] ?? {};
      next[emotion] = {
        ...existing,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.brightness !== undefined ? { brightness: patch.brightness } : {}),
        ...(patch.h !== undefined ? { color: { ...base.color, ...existing.color, h: patch.h } } : {}),
      };
    }
    void onChange({ overrides: next });
  };

  return (
    <div className="card flex flex-col gap-5">
      <div className="label">Personalisation</div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Intensity" value={preferences.intensity} min={0} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => onChange({ intensity: v })} />
        <Slider label="Responsiveness" value={preferences.smoothing} min={0.05} max={1} step={0.05} format={(v) => (v < 0.3 ? "calm" : v < 0.7 ? "balanced" : "snappy")} onChange={(v) => onChange({ smoothing: v })} />
        <Slider label="Minimum confidence" value={preferences.minConfidence} min={0} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => onChange({ minConfidence: v })} />
        <Slider label="Switch delay" value={preferences.hysteresisMs} min={0} max={20000} step={500} format={(v) => `${(v / 1000).toFixed(1)} s`} onChange={(v) => onChange({ hysteresisMs: v })} />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={preferences.blend} onChange={(e) => onChange({ blend: e.target.checked })} />
          Blend between neighbouring moods
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.quietHours.enabled}
            onChange={(e) => onChange({ quietHours: { ...preferences.quietHours, enabled: e.target.checked } })}
          />
          Quiet hours
        </label>
        {preferences.quietHours.enabled && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <HourInput value={preferences.quietHours.startHour} onChange={(v) => onChange({ quietHours: { ...preferences.quietHours, startHour: v } })} />
            to
            <HourInput value={preferences.quietHours.endHour} onChange={(v) => onChange({ quietHours: { ...preferences.quietHours, endHour: v } })} />
            max
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round(preferences.quietHours.maxBrightness * 100)}
              onChange={(e) => onChange({ quietHours: { ...preferences.quietHours, maxBrightness: Number(e.target.value) / 100 } })}
              className="w-14 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-zinc-100"
            />
            %
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-medium">Scene overrides</div>
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value as Emotion)}
            className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-sm capitalize"
          >
            {EMOTIONS.map((e) => (
              <option key={e} value={e}>
                {e}
                {preferences.overrides[e] ? " •" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block text-xs">
            <div className="mb-1 text-zinc-300">Scene name</div>
            <input
              value={override.name ?? base.name}
              onChange={(e) => setOverride({ name: e.target.value })}
              className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <div className="flex flex-col gap-3">
            <label className="block">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-zinc-300">Hue</span>
                <span className="inline-block h-3 w-8 rounded-sm" style={{ background: `hsl(${hue} 80% 55%)` }} />
              </div>
              <input
                type="range"
                min={0}
                max={359}
                step={1}
                value={hue}
                onChange={(e) => setOverride({ h: Number(e.target.value) })}
                style={{ background: "linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
              />
            </label>
            <Slider label="Brightness" value={brightness} min={0.05} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setOverride({ brightness: v })} />
          </div>
          <button className="btn" onClick={() => setOverride(null)} disabled={!preferences.overrides[emotion]}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function HourInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={23}
      value={value}
      onChange={(e) => onChange(Math.max(0, Math.min(23, Number(e.target.value))))}
      className="w-14 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-zinc-100"
    />
  );
}
