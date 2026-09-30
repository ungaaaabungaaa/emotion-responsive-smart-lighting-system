"use client";

import type { LightState } from "@/lib/client-types";

function hsl(state: LightState, lightness?: number, alpha = 1) {
  const { h, s, l } = state.color;
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round((lightness ?? l) * 100)}% / ${alpha})`;
}

/**
 * A stylised living room lit by the current LightState. Everything is CSS so the
 * preview tracks brightness, hue, transition time and dynamic effects in real time.
 */
export function RoomPreview({ state }: { state: LightState }) {
  const b = state.brightness;
  const transition = `${Math.max(200, state.transitionMs)}ms`;
  const effectClass = state.effect === "none" ? "" : `effect-${state.effect}`;
  const effectStyle = { "--effect-duration": `${state.effectPeriodMs || 4000}ms` } as React.CSSProperties;

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: `linear-gradient(180deg, ${hsl(state, 0.08 + b * 0.12)} 0%, ${hsl(state, 0.05 + b * 0.05)} 70%, #0b0b0d 100%)`,
        transition: `background ${transition} ease`,
      }}
      aria-label={`Virtual room showing the ${state.sceneName} scene`}
    >
      {/* wall wash */}
      <div
        className={`absolute inset-0 ${effectClass}`}
        style={{
          ...effectStyle,
          background: `radial-gradient(ellipse at 50% 20%, ${hsl(state, 0.55, 0.15 + b * 0.55)} 0%, transparent 60%)`,
          transition: `background ${transition} ease`,
        }}
      />
      {/* pendant lamp */}
      <div className="absolute left-1/2 top-0 h-[22%] w-px -translate-x-1/2 bg-zinc-600" />
      <div
        className={`absolute left-1/2 top-[22%] h-10 w-10 -translate-x-1/2 rounded-full ${effectClass}`}
        style={{
          ...effectStyle,
          background: hsl(state, 0.3 + b * 0.55),
          boxShadow: `0 0 ${20 + b * 80}px ${8 + b * 30}px ${hsl(state, 0.55, 0.25 + b * 0.55)}`,
          transition: `all ${transition} ease`,
        }}
      />
      {/* floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[32%]"
        style={{
          background: `linear-gradient(180deg, ${hsl(state, 0.12 + b * 0.1)} 0%, #0a0a0c 100%)`,
          transition: `background ${transition} ease`,
        }}
      />
      {/* sofa */}
      <div
        className="absolute bottom-[18%] left-[14%] h-[22%] w-[38%] rounded-xl"
        style={{
          background: `linear-gradient(180deg, ${hsl(state, 0.2 + b * 0.15)} 0%, ${hsl(state, 0.1 + b * 0.08)} 100%)`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          transition: `background ${transition} ease`,
        }}
      />
      {/* side table + lamp */}
      <div
        className="absolute bottom-[18%] right-[16%] h-[14%] w-[14%] rounded-md"
        style={{ background: `hsl(30 15% ${8 + b * 10}%)`, transition: `background ${transition} ease` }}
      />
      <div
        className={`absolute bottom-[32%] right-[19%] h-[12%] w-[8%] rounded-t-full ${effectClass}`}
        style={{
          ...effectStyle,
          background: hsl(state, 0.35 + b * 0.5),
          boxShadow: `0 0 ${10 + b * 40}px ${4 + b * 12}px ${hsl(state, 0.55, 0.2 + b * 0.5)}`,
          transition: `all ${transition} ease`,
        }}
      />
      {/* window */}
      <div className="absolute right-[8%] top-[12%] h-[30%] w-[16%] rounded-md border border-white/10 bg-gradient-to-b from-sky-950/60 to-zinc-900/60" />

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs backdrop-blur">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: state.hex }} />
        <span className="font-medium">{state.sceneName}</span>
        <span className="text-zinc-400">· {Math.round(b * 100)}%</span>
        {state.effect !== "none" && <span className="text-zinc-400">· {state.effect}</span>}
      </div>
    </div>
  );
}
