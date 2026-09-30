import {
  EMOTIONS,
  EMOTION_AFFECT,
  clamp,
  nearestEmotion,
  type Affect,
  type Emotion,
  type EmotionReading,
} from "@/lib/emotion/types";
import { hslToHex, lerp, lerpHsl, type HSL } from "./color";
import { resolveProfile, type LightEffect, type ProfileOverrides } from "./profiles";

/** The concrete illumination the engine wants the room to show right now. */
export interface LightState {
  emotion: Emotion;
  sceneName: string;
  rationale: string;
  color: HSL;
  hex: string;
  brightness: number;
  colorTemperature: number;
  transitionMs: number;
  effect: LightEffect;
  effectPeriodMs: number;
  /** Smoothed affect the state was derived from. */
  affect: Affect;
  confidence: number;
  updatedAt: number;
  /** True when the last reading was rejected (low confidence) and the state was kept. */
  held: boolean;
}

export interface QuietHours {
  enabled: boolean;
  /** Hour of day (0–23) when quiet hours begin. */
  startHour: number;
  /** Hour of day (0–23) when quiet hours end. */
  endHour: number;
  /** Brightness ceiling while quiet hours are active, in [0, 1]. */
  maxBrightness: number;
}

/** User-tunable behaviour. Everything has a sensible default. */
export interface UserPreferences {
  /** Global brightness multiplier in [0, 1]. */
  intensity: number;
  /** Exponential smoothing factor in (0, 1]; lower = calmer, slower response. */
  smoothing: number;
  /** Readings below this confidence are ignored. */
  minConfidence: number;
  /** Minimum time a new emotion must persist before the lights switch, in ms. */
  hysteresisMs: number;
  /** Blend colours between neighbouring emotions instead of snapping to one preset. */
  blend: boolean;
  quietHours: QuietHours;
  overrides: ProfileOverrides;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  intensity: 1,
  smoothing: 0.35,
  minConfidence: 0.4,
  hysteresisMs: 4000,
  blend: true,
  quietHours: { enabled: false, startHour: 22, endHour: 7, maxBrightness: 0.3 },
  overrides: {},
};

export interface EngineOptions {
  preferences?: Partial<UserPreferences>;
  /** Injected clock for deterministic tests. */
  now?: () => number;
  /** Maximum number of readings kept in history. */
  historyLimit?: number;
}

function isInQuietHours(quiet: QuietHours, date: Date): boolean {
  if (!quiet.enabled) return false;
  const hour = date.getHours();
  if (quiet.startHour === quiet.endHour) return true;
  if (quiet.startHour < quiet.endHour) return hour >= quiet.startHour && hour < quiet.endHour;
  return hour >= quiet.startHour || hour < quiet.endHour;
}

/**
 * Turns a stream of noisy emotion readings into a stable, personalised light state.
 *
 * Pipeline: confidence gate → exponential smoothing on the affect plane →
 * hysteresis on the discrete emotion → profile resolution (with user overrides) →
 * optional blending with the nearest neighbouring emotion → global intensity and
 * quiet-hours caps.
 */
export class LightingEngine {
  private preferences: UserPreferences;
  private readonly now: () => number;
  private readonly historyLimit: number;

  private affect: Affect = { valence: 0, arousal: 0 };
  private current: Emotion = "neutral";
  private candidate: Emotion | null = null;
  private candidateSince = 0;
  private lastConfidence = 0;
  private readonly history: EmotionReading[] = [];
  private state: LightState;

  constructor(options: EngineOptions = {}) {
    this.preferences = mergePreferences(DEFAULT_PREFERENCES, options.preferences ?? {});
    this.now = options.now ?? (() => Date.now());
    this.historyLimit = options.historyLimit ?? 200;
    this.state = this.compose(false);
  }

  getPreferences(): UserPreferences {
    return this.preferences;
  }

  setPreferences(update: Partial<UserPreferences>): LightState {
    this.preferences = mergePreferences(this.preferences, update);
    this.state = this.compose(false);
    return this.state;
  }

  getState(): LightState {
    return this.state;
  }

  getHistory(): EmotionReading[] {
    return this.history;
  }

  /** Forces a specific emotion immediately, bypassing smoothing and hysteresis. */
  override(emotion: Emotion, source: EmotionReading["source"] = "manual"): LightState {
    const reading: EmotionReading = { emotion, confidence: 1, source, timestamp: this.now() };
    this.record(reading);
    this.affect = { ...EMOTION_AFFECT[emotion] };
    this.current = emotion;
    this.candidate = null;
    this.lastConfidence = 1;
    this.state = this.compose(false);
    return this.state;
  }

  /** Feeds a new observation into the engine and returns the resulting light state. */
  ingest(reading: EmotionReading): LightState {
    this.record(reading);
    const { minConfidence, smoothing, hysteresisMs } = this.preferences;

    if (reading.source === "manual") {
      return this.override(reading.emotion, "manual");
    }

    if (reading.confidence < minConfidence) {
      this.state = { ...this.state, held: true, updatedAt: this.now() };
      return this.state;
    }

    const target = EMOTION_AFFECT[reading.emotion];
    const alpha = clamp(smoothing * reading.confidence, 0.02, 1);
    this.affect = {
      valence: lerp(this.affect.valence, target.valence, alpha),
      arousal: lerp(this.affect.arousal, target.arousal, alpha),
    };
    this.lastConfidence = reading.confidence;

    const nearest = nearestEmotion(this.affect);
    const now = this.now();
    if (nearest !== this.current) {
      if (this.candidate !== nearest) {
        this.candidate = nearest;
        this.candidateSince = now;
      }
      if (now - this.candidateSince >= hysteresisMs) {
        this.current = nearest;
        this.candidate = null;
      }
    } else {
      this.candidate = null;
    }

    this.state = this.compose(false);
    return this.state;
  }

  private record(reading: EmotionReading) {
    this.history.push(reading);
    if (this.history.length > this.historyLimit) {
      this.history.splice(0, this.history.length - this.historyLimit);
    }
  }

  private compose(held: boolean): LightState {
    const { overrides, blend, intensity, quietHours } = this.preferences;
    const profile = resolveProfile(this.current, overrides);

    let color = profile.color;
    let brightness = profile.brightness;
    let colorTemperature = profile.colorTemperature;

    if (blend) {
      const neighbour = this.nearestNeighbour(this.current);
      if (neighbour) {
        const other = resolveProfile(neighbour.emotion, overrides);
        const t = neighbour.weight;
        color = lerpHsl(profile.color, other.color, t);
        brightness = lerp(profile.brightness, other.brightness, t);
        colorTemperature = Math.round(lerp(profile.colorTemperature, other.colorTemperature, t));
      }
    }

    brightness *= clamp(intensity, 0, 1);
    if (isInQuietHours(quietHours, new Date(this.now()))) {
      brightness = Math.min(brightness, quietHours.maxBrightness);
    }
    brightness = clamp(brightness, 0, 1);

    return {
      emotion: this.current,
      sceneName: profile.name,
      rationale: profile.rationale,
      color,
      hex: hslToHex(color),
      brightness: Number(brightness.toFixed(3)),
      colorTemperature,
      transitionMs: profile.transitionMs,
      effect: profile.effect,
      effectPeriodMs: profile.effectPeriodMs,
      affect: { valence: Number(this.affect.valence.toFixed(3)), arousal: Number(this.affect.arousal.toFixed(3)) },
      confidence: this.lastConfidence,
      updatedAt: this.now(),
      held,
    };
  }

  /**
   * Finds the emotion (other than the current one) closest to the smoothed affect and
   * returns a blend weight in [0, 0.5]: 0 when the affect sits exactly on the current
   * emotion, approaching 0.5 when it is midway to the neighbour.
   */
  private nearestNeighbour(current: Emotion): { emotion: Emotion; weight: number } | null {
    const distanceTo = (emotion: Emotion) => {
      const target = EMOTION_AFFECT[emotion];
      return Math.hypot(target.valence - this.affect.valence, target.arousal - this.affect.arousal);
    };
    const dCurrent = distanceTo(current);
    let best: Emotion | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const emotion of EMOTIONS) {
      if (emotion === current) continue;
      const d = distanceTo(emotion);
      if (d < bestDistance) {
        bestDistance = d;
        best = emotion;
      }
    }
    if (!best) return null;
    const total = dCurrent + bestDistance;
    if (total === 0) return null;
    const weight = clamp(dCurrent / total, 0, 0.5);
    return { emotion: best, weight: Number(weight.toFixed(3)) };
  }
}

export function mergePreferences(base: UserPreferences, update: Partial<UserPreferences>): UserPreferences {
  return {
    ...base,
    ...update,
    intensity: clamp(update.intensity ?? base.intensity, 0, 1),
    smoothing: clamp(update.smoothing ?? base.smoothing, 0.01, 1),
    minConfidence: clamp(update.minConfidence ?? base.minConfidence, 0, 1),
    hysteresisMs: Math.max(0, update.hysteresisMs ?? base.hysteresisMs),
    quietHours: { ...base.quietHours, ...(update.quietHours ?? {}) },
    overrides: { ...base.overrides, ...(update.overrides ?? {}) },
  };
}
