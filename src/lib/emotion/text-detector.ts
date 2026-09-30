import { EMOTIONS, type Emotion, type EmotionReading } from "./types";

/**
 * A small, dependency-free lexicon classifier. It is deliberately simple: it lets the
 * system work fully offline (journaling, chat, voice transcripts) and acts as a fallback
 * when the camera detector is unavailable. Swap it for an ML model via the
 * `EmotionDetector` interface without touching the lighting side.
 */

const LEXICON: Record<Exclude<Emotion, "neutral">, string[]> = {
  happy: [
    "happy", "joy", "joyful", "great", "wonderful", "amazing", "love", "loved", "excited",
    "delighted", "glad", "fantastic", "awesome", "cheerful", "grateful", "thrilled", "yay",
    "smile", "smiling", "laugh", "laughing", "celebrate", "proud", "good",
  ],
  calm: [
    "calm", "relaxed", "relax", "peaceful", "peace", "serene", "tranquil", "content", "cozy",
    "chill", "rest", "resting", "unwind", "quiet", "gentle", "soothing", "at ease", "mellow",
  ],
  focused: [
    "focus", "focused", "focusing", "working", "work", "study", "studying", "concentrate",
    "concentrating", "deep work", "productive", "deadline", "task", "coding", "reading",
    "writing", "meeting", "busy",
  ],
  sad: [
    "sad", "unhappy", "down", "depressed", "miserable", "lonely", "alone", "cry", "crying",
    "tears", "grief", "grieving", "heartbroken", "hopeless", "blue", "gloomy", "hurt", "loss",
    "miss", "missing",
  ],
  angry: [
    "angry", "anger", "mad", "furious", "rage", "annoyed", "irritated", "frustrated",
    "frustrating", "hate", "hated", "pissed", "outraged", "livid", "fed up", "infuriating",
  ],
  anxious: [
    "anxious", "anxiety", "nervous", "worried", "worry", "stressed", "stress", "panic",
    "panicking", "overwhelmed", "scared", "afraid", "fear", "tense", "uneasy", "dread",
    "restless", "jittery",
  ],
  tired: [
    "tired", "exhausted", "sleepy", "drained", "fatigued", "weary", "burnt out", "burned out",
    "worn out", "yawn", "no energy", "sluggish", "drowsy", "bed", "sleep",
  ],
  surprised: [
    "surprised", "surprise", "wow", "whoa", "shocked", "astonished", "unexpected", "can't believe",
    "no way", "omg", "unbelievable", "stunned",
  ],
};

const NEGATIONS = ["not", "no", "never", "isn't", "aren't", "don't", "doesn't", "didn't", "can't"];
const INTENSIFIERS = ["very", "so", "really", "extremely", "super", "incredibly", "totally"];

export interface TextDetectionResult {
  emotion: Emotion;
  confidence: number;
  scores: Record<Emotion, number>;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Scores free-form text against the emotion lexicon. */
export function analyzeText(text: string): TextDetectionResult {
  const scores = Object.fromEntries(EMOTIONS.map((e) => [e, 0])) as Record<Emotion, number>;
  const lower = text.toLowerCase();
  const tokens = tokenize(text);

  for (const emotion of Object.keys(LEXICON) as Array<keyof typeof LEXICON>) {
    for (const phrase of LEXICON[emotion]) {
      if (phrase.includes(" ")) {
        if (lower.includes(phrase)) scores[emotion] += 1;
        continue;
      }
      tokens.forEach((token, index) => {
        if (token !== phrase) return;
        let weight = 1;
        const window = tokens.slice(Math.max(0, index - 3), index);
        if (window.some((w) => INTENSIFIERS.includes(w))) weight *= 1.5;
        if (window.some((w) => NEGATIONS.includes(w))) weight *= -0.5;
        scores[emotion] += weight;
      });
    }
  }

  let best: Emotion = "neutral";
  let bestScore = 0;
  for (const emotion of EMOTIONS) {
    if (scores[emotion] > bestScore) {
      bestScore = scores[emotion];
      best = emotion;
    }
  }

  const total = EMOTIONS.reduce((sum, e) => sum + Math.max(0, scores[e]), 0);
  const confidence = best === "neutral" ? 0.35 : Math.min(0.95, 0.5 + (bestScore / Math.max(total, 1)) * 0.45);

  return { emotion: best, confidence, scores };
}

export function readingFromText(text: string, timestamp = Date.now()): EmotionReading {
  const { emotion, confidence } = analyzeText(text);
  return { emotion, confidence, source: "text", timestamp };
}
