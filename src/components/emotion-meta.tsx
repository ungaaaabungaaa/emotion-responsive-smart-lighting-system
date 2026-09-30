import type { Emotion } from "@/lib/client-types";

export const EMOTION_META: Record<Emotion, { emoji: string; hint: string }> = {
  happy: { emoji: "😊", hint: "Upbeat, sociable" },
  calm: { emoji: "😌", hint: "Relaxed, at ease" },
  focused: { emoji: "🎯", hint: "Working, studying" },
  sad: { emoji: "😢", hint: "Down, low energy" },
  angry: { emoji: "😠", hint: "Frustrated, tense" },
  anxious: { emoji: "😰", hint: "Worried, stressed" },
  tired: { emoji: "😴", hint: "Sleepy, drained" },
  surprised: { emoji: "😮", hint: "Startled, amazed" },
  neutral: { emoji: "😐", hint: "Baseline" },
};
