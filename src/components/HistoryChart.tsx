"use client";

import { EMOTION_AFFECT } from "@/lib/emotion/types";
import { DEFAULT_PROFILES } from "@/lib/lighting/profiles";
import { hslToHex } from "@/lib/lighting/color";
import type { EmotionReading } from "@/lib/client-types";

/** A timeline strip of recent readings plus a valence sparkline. */
export function HistoryChart({ history }: { history: EmotionReading[] }) {
  if (history.length === 0) {
    return (
      <div className="card">
        <div className="label">Mood timeline</div>
        <p className="mt-2 text-sm text-zinc-400">No readings yet. Use the camera, type how you feel, or pick an emotion.</p>
      </div>
    );
  }

  const recent = history.slice(-40);
  const width = 400;
  const height = 60;
  const points = recent
    .map((r, i) => {
      const x = (i / Math.max(1, recent.length - 1)) * width;
      const y = height / 2 - EMOTION_AFFECT[r.emotion].valence * (height / 2 - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="label">Mood timeline</div>
        <div className="text-xs text-zinc-500">{history.length} readings</div>
      </div>
      <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full" role="img" aria-label="Recent emotions">
        {recent.map((r, i) => (
          <div
            key={`${r.timestamp}-${i}`}
            className="h-full flex-1"
            title={`${r.emotion} (${Math.round(r.confidence * 100)}%, ${r.source})`}
            style={{ background: hslToHex(DEFAULT_PROFILES[r.emotion].color), opacity: 0.4 + r.confidence * 0.6 }}
          />
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label="Valence over time">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
        <polyline points={points} fill="none" stroke="#e4e4e7" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
        <span>earlier</span>
        <span>valence</span>
        <span>now</span>
      </div>
    </div>
  );
}
