/**
 * Core emotion model.
 *
 * Every emotion is described both by a discrete label (what the UI shows) and by a
 * position on the circumplex model of affect: valence (unpleasant → pleasant) and
 * arousal (calm → activated). The continuous coordinates let the lighting engine
 * blend smoothly between emotions instead of snapping between presets.
 */

export const EMOTIONS = [
  "happy",
  "calm",
  "focused",
  "sad",
  "angry",
  "anxious",
  "tired",
  "surprised",
  "neutral",
] as const;

export type Emotion = (typeof EMOTIONS)[number];

export function isEmotion(value: unknown): value is Emotion {
  return typeof value === "string" && (EMOTIONS as readonly string[]).includes(value);
}

/** Position on the circumplex model, both axes in [-1, 1]. */
export interface Affect {
  valence: number;
  arousal: number;
}

export const EMOTION_AFFECT: Record<Emotion, Affect> = {
  happy: { valence: 0.85, arousal: 0.55 },
  calm: { valence: 0.55, arousal: -0.7 },
  focused: { valence: 0.35, arousal: 0.25 },
  sad: { valence: -0.75, arousal: -0.55 },
  angry: { valence: -0.8, arousal: 0.8 },
  anxious: { valence: -0.5, arousal: 0.65 },
  tired: { valence: -0.2, arousal: -0.85 },
  surprised: { valence: 0.25, arousal: 0.9 },
  neutral: { valence: 0, arousal: 0 },
};

/** How an emotion reading was produced. */
export type EmotionSource = "camera" | "text" | "manual" | "api";

/** A single observation of the user's emotional state. */
export interface EmotionReading {
  emotion: Emotion;
  /** Detector confidence in [0, 1]. */
  confidence: number;
  source: EmotionSource;
  /** Unix epoch milliseconds. */
  timestamp: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Finds the discrete emotion whose affect coordinates are closest to the given point. */
export function nearestEmotion(affect: Affect): Emotion {
  let best: Emotion = "neutral";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const emotion of EMOTIONS) {
    const target = EMOTION_AFFECT[emotion];
    const dv = target.valence - affect.valence;
    const da = target.arousal - affect.arousal;
    const distance = dv * dv + da * da;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = emotion;
    }
  }
  return best;
}
