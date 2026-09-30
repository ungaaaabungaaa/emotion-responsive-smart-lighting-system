import type { Emotion } from "@/lib/emotion/types";
import type { HSL } from "./color";

/** A dynamic effect layered on top of the static color. */
export type LightEffect = "none" | "breathe" | "pulse" | "candle";

/** The intended illumination for a single emotional state. */
export interface LightingProfile {
  /** Human-friendly scene name shown in the UI. */
  name: string;
  /** Why this lighting was chosen; surfaced to the user for transparency. */
  rationale: string;
  color: HSL;
  /** Overall brightness in [0, 1]. */
  brightness: number;
  /** Correlated color temperature in kelvin (used by tunable-white bulbs). */
  colorTemperature: number;
  /** Time in milliseconds to fade from the previous state. */
  transitionMs: number;
  effect: LightEffect;
  /** Effect cycle length in milliseconds when an effect is active. */
  effectPeriodMs: number;
}

/**
 * Default emotion → lighting mapping.
 *
 * The mapping follows colour-psychology and circadian-lighting research at a high
 * level: warm, dim light soothes; cool, bright light energises; slow breathing
 * effects guide breathing rate downward for anxious users; low-arousal negative
 * states get gentle warmth rather than mirroring the mood.
 */
export const DEFAULT_PROFILES: Record<Emotion, LightingProfile> = {
  happy: {
    name: "Sunrise Glow",
    rationale: "Warm golden light amplifies positive energy and sociability.",
    color: { h: 38, s: 0.95, l: 0.58 },
    brightness: 0.9,
    colorTemperature: 3200,
    transitionMs: 1500,
    effect: "none",
    effectPeriodMs: 0,
  },
  calm: {
    name: "Lagoon",
    rationale: "Soft teal at low brightness lowers arousal and supports relaxation.",
    color: { h: 190, s: 0.55, l: 0.5 },
    brightness: 0.45,
    colorTemperature: 2700,
    transitionMs: 4000,
    effect: "none",
    effectPeriodMs: 0,
  },
  focused: {
    name: "Daylight Desk",
    rationale: "Cool, bright neutral-white light improves alertness and concentration.",
    color: { h: 210, s: 0.25, l: 0.85 },
    brightness: 1,
    colorTemperature: 5500,
    transitionMs: 2000,
    effect: "none",
    effectPeriodMs: 0,
  },
  sad: {
    name: "Hearth",
    rationale: "Gentle amber warmth offers comfort without harshness.",
    color: { h: 25, s: 0.7, l: 0.5 },
    brightness: 0.55,
    colorTemperature: 2400,
    transitionMs: 5000,
    effect: "candle",
    effectPeriodMs: 4000,
  },
  angry: {
    name: "Cool Down",
    rationale: "Muted blue-green light is calming and avoids reinforcing agitation.",
    color: { h: 165, s: 0.35, l: 0.45 },
    brightness: 0.5,
    colorTemperature: 3000,
    transitionMs: 6000,
    effect: "none",
    effectPeriodMs: 0,
  },
  anxious: {
    name: "Slow Breath",
    rationale: "A dim lavender that breathes at 6 cycles per minute paces relaxed breathing.",
    color: { h: 265, s: 0.45, l: 0.55 },
    brightness: 0.4,
    colorTemperature: 2700,
    transitionMs: 3000,
    effect: "breathe",
    effectPeriodMs: 10000,
  },
  tired: {
    name: "Ember",
    rationale: "Very warm, very dim light limits blue exposure and eases wind-down.",
    color: { h: 18, s: 0.85, l: 0.4 },
    brightness: 0.25,
    colorTemperature: 2000,
    transitionMs: 8000,
    effect: "none",
    effectPeriodMs: 0,
  },
  surprised: {
    name: "Spark",
    rationale: "A bright, saturated accent acknowledges the moment, then settles.",
    color: { h: 320, s: 0.8, l: 0.6 },
    brightness: 0.95,
    colorTemperature: 4000,
    transitionMs: 400,
    effect: "pulse",
    effectPeriodMs: 1500,
  },
  neutral: {
    name: "Everyday",
    rationale: "Balanced warm-white for general use.",
    color: { h: 45, s: 0.3, l: 0.75 },
    brightness: 0.7,
    colorTemperature: 3500,
    transitionMs: 2500,
    effect: "none",
    effectPeriodMs: 0,
  },
};

/** Per-user overrides of the default mapping; every field is optional. */
export type ProfileOverride = Partial<Omit<LightingProfile, "name" | "rationale" | "color">> & {
  name?: string;
  color?: Partial<HSL>;
};

export type ProfileOverrides = Partial<Record<Emotion, ProfileOverride>>;

export function resolveProfile(emotion: Emotion, overrides: ProfileOverrides = {}): LightingProfile {
  const base = DEFAULT_PROFILES[emotion];
  const override = overrides[emotion];
  if (!override) return base;
  return {
    ...base,
    ...override,
    color: override.color ? { ...base.color, ...override.color } : base.color,
    rationale: override.name && override.name !== base.name ? "Personalised by you." : base.rationale,
  };
}
