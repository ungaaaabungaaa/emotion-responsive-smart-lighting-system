"use client";

import { EMOTIONS } from "@/lib/emotion/types";
import { DEFAULT_PROFILES } from "@/lib/lighting/profiles";
import { hslToHex } from "@/lib/lighting/color";
import type { Emotion } from "@/lib/client-types";
import { EMOTION_META } from "./emotion-meta";

/** Grid of emotion buttons for immediate manual override. */
export function ManualPicker({ current, onPick }: { current: Emotion; onPick: (emotion: Emotion) => Promise<void> }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {EMOTIONS.map((emotion) => {
        const active = emotion === current;
        const color = hslToHex(DEFAULT_PROFILES[emotion].color);
        return (
          <button
            key={emotion}
            onClick={() => onPick(emotion)}
            className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
              active ? "border-white/40 bg-white/10" : "border-white/10 bg-black/20 hover:bg-white/5"
            }`}
            aria-pressed={active}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-lg" aria-hidden>{EMOTION_META[emotion].emoji}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            </div>
            <div className="mt-1 text-sm font-medium capitalize">{emotion}</div>
            <div className="text-[11px] text-zinc-500">{DEFAULT_PROFILES[emotion].name}</div>
          </button>
        );
      })}
    </div>
  );
}
