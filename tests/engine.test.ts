import { describe, expect, it } from "vitest";
import type { EmotionReading } from "@/lib/emotion";
import { DEFAULT_PROFILES, LightingEngine } from "@/lib/lighting";

function makeClock(start = 1_000_000) {
  let now = start;
  return {
    now: () => now,
    advance(ms: number) {
      now += ms;
    },
  };
}

function reading(emotion: EmotionReading["emotion"], confidence = 0.9, timestamp = 0): EmotionReading {
  return { emotion, confidence, source: "camera", timestamp };
}

describe("LightingEngine", () => {
  it("starts neutral", () => {
    const engine = new LightingEngine();
    const state = engine.getState();
    expect(state.emotion).toBe("neutral");
    expect(state.sceneName).toBe(DEFAULT_PROFILES.neutral.name);
    expect(state.hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("ignores low-confidence readings and marks the state as held", () => {
    const engine = new LightingEngine({ preferences: { minConfidence: 0.6 } });
    const state = engine.ingest(reading("angry", 0.2));
    expect(state.emotion).toBe("neutral");
    expect(state.held).toBe(true);
    expect(engine.getHistory()).toHaveLength(1);
  });

  it("applies hysteresis before switching emotions", () => {
    const clock = makeClock();
    const engine = new LightingEngine({ now: clock.now, preferences: { hysteresisMs: 3000, smoothing: 1 } });

    let state = engine.ingest(reading("happy"));
    expect(state.emotion).toBe("neutral");

    clock.advance(1000);
    state = engine.ingest(reading("happy"));
    expect(state.emotion).toBe("neutral");

    clock.advance(2500);
    state = engine.ingest(reading("happy"));
    expect(state.emotion).toBe("happy");
    expect(state.sceneName).toBe("Sunrise Glow");
  });

  it("smooths noisy readings instead of flickering", () => {
    const clock = makeClock();
    const engine = new LightingEngine({ now: clock.now, preferences: { hysteresisMs: 0, smoothing: 0.2 } });
    engine.override("calm");

    const state = engine.ingest(reading("angry", 0.9));
    clock.advance(500);
    expect(state.emotion).toBe("calm");
    expect(state.affect.valence).toBeGreaterThan(-0.3);
  });

  it("manual readings take effect immediately", () => {
    const engine = new LightingEngine({ preferences: { hysteresisMs: 60_000 } });
    const state = engine.ingest({ emotion: "tired", confidence: 1, source: "manual", timestamp: 0 });
    expect(state.emotion).toBe("tired");
    expect(state.brightness).toBeCloseTo(DEFAULT_PROFILES.tired.brightness, 2);
  });

  it("scales brightness by global intensity", () => {
    const engine = new LightingEngine({ preferences: { intensity: 0.5, blend: false } });
    const state = engine.override("focused");
    expect(state.brightness).toBeCloseTo(DEFAULT_PROFILES.focused.brightness * 0.5, 3);
  });

  it("caps brightness during quiet hours", () => {
    const night = new Date();
    night.setHours(23, 30, 0, 0);
    const engine = new LightingEngine({
      now: () => night.getTime(),
      preferences: { quietHours: { enabled: true, startHour: 22, endHour: 7, maxBrightness: 0.2 } },
    });
    const state = engine.override("happy");
    expect(state.brightness).toBeLessThanOrEqual(0.2);

    const day = new Date();
    day.setHours(12, 0, 0, 0);
    const dayEngine = new LightingEngine({
      now: () => day.getTime(),
      preferences: { quietHours: { enabled: true, startHour: 22, endHour: 7, maxBrightness: 0.2 } },
    });
    expect(dayEngine.override("happy").brightness).toBeGreaterThan(0.2);
  });

  it("blends towards the neighbouring emotion when affect drifts", () => {
    const clock = makeClock();
    const blended = new LightingEngine({ now: clock.now, preferences: { hysteresisMs: 0, smoothing: 0.3, blend: true } });
    const snapped = new LightingEngine({ now: clock.now, preferences: { hysteresisMs: 0, smoothing: 0.3, blend: false } });

    blended.override("calm");
    snapped.override("calm");
    const a = blended.ingest(reading("tired", 0.9));
    const b = snapped.ingest(reading("tired", 0.9));

    expect(a.emotion).toBe(b.emotion);
    expect(a.hex).not.toBe(b.hex);
    expect(b.hex).toBe(new LightingEngine({ preferences: { blend: false } }).override(b.emotion).hex);
  });

  it("uses personalised overrides", () => {
    const engine = new LightingEngine({
      preferences: { blend: false, overrides: { sad: { name: "Rainy Day", brightness: 0.9 } } },
    });
    const state = engine.override("sad");
    expect(state.sceneName).toBe("Rainy Day");
    expect(state.brightness).toBeCloseTo(0.9, 3);
  });

  it("trims history to the configured limit", () => {
    const engine = new LightingEngine({ historyLimit: 5 });
    for (let i = 0; i < 12; i++) engine.override("happy");
    expect(engine.getHistory()).toHaveLength(5);
  });
});
