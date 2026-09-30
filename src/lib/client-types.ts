/** Types shared between the API routes and the browser UI. */
export type { EmotionReading, Emotion, EmotionSource, Affect } from "@/lib/emotion/types";
export type { LightState, UserPreferences, QuietHours } from "@/lib/lighting/engine";
export type { DriverId, DriverInfo, ApplyResult } from "@/lib/lighting/drivers/types";
export type { SystemSnapshot } from "@/lib/server/system";
export type { LightEffect, ProfileOverride } from "@/lib/lighting/profiles";
