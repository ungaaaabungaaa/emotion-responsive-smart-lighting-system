"use client";

import { EMOTIONS, EMOTION_AFFECT } from "@/lib/emotion/types";
import type { LightState } from "@/lib/client-types";
import { EMOTION_META } from "./emotion-meta";

/** Current emotion, scene explanation, and a live dot on the valence/arousal plane. */
export function EmotionPanel({ state }: { state: LightState }) {
  const meta = EMOTION_META[state.emotion];
  const x = 50 + state.affect.valence * 45;
  const y = 50 - state.affect.arousal * 45;

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label">Detected emotion</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <span aria-hidden>{meta.emoji}</span>
            <span className="capitalize">{state.emotion}</span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">{state.rationale}</p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          <div>
            Confidence <span className="text-zinc-100">{Math.round(state.confidence * 100)}%</span>
          </div>
          {state.held && <div className="mt-1 text-amber-300">Low confidence, holding scene</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Colour" value={state.hex.toUpperCase()} swatch={state.hex} />
        <Stat label="Brightness" value={`${Math.round(state.brightness * 100)}%`} />
        <Stat label="Temperature" value={`${state.colorTemperature} K`} />
        <Stat label="Transition" value={`${(state.transitionMs / 1000).toFixed(1)} s`} />
      </div>

      <div>
        <div className="label mb-2">Affect plane</div>
        <svg viewBox="0 0 100 100" className="w-full rounded-xl border border-white/10 bg-black/30" role="img" aria-label="Valence and arousal plot">
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
          <text x="98" y="52" fontSize="4" fill="#a1a1aa" textAnchor="end">pleasant</text>
          <text x="2" y="52" fontSize="4" fill="#a1a1aa">unpleasant</text>
          <text x="52" y="5" fontSize="4" fill="#a1a1aa">activated</text>
          <text x="52" y="98" fontSize="4" fill="#a1a1aa">calm</text>
          {EMOTIONS.map((e) => {
            const a = EMOTION_AFFECT[e];
            return (
              <g key={e}>
                <circle cx={50 + a.valence * 45} cy={50 - a.arousal * 45} r="1.4" fill={e === state.emotion ? "#fff" : "#52525b"} />
                <text x={50 + a.valence * 45 + 2} y={50 - a.arousal * 45 - 1.5} fontSize="3.2" fill={e === state.emotion ? "#fff" : "#71717a"}>
                  {e}
                </text>
              </g>
            );
          })}
          <circle cx={x} cy={y} r="3" fill={state.hex} stroke="#fff" strokeWidth="0.8" style={{ transition: "cx 600ms ease, cy 600ms ease" }} />
        </svg>
      </div>
    </div>
  );
}

function Stat({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-0.5 flex items-center gap-2 font-medium">
        {swatch && <span className="inline-block h-3 w-3 rounded-sm" style={{ background: swatch }} />}
        {value}
      </div>
    </div>
  );
}
