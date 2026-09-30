import { describe, expect, it } from "vitest";
import { EMOTIONS } from "@/lib/emotion";
import { DEFAULT_PROFILES, resolveProfile } from "@/lib/lighting";

describe("lighting profiles", () => {
  it("defines a profile for every emotion", () => {
    for (const emotion of EMOTIONS) {
      const profile = DEFAULT_PROFILES[emotion];
      expect(profile.brightness).toBeGreaterThanOrEqual(0);
      expect(profile.brightness).toBeLessThanOrEqual(1);
      expect(profile.colorTemperature).toBeGreaterThanOrEqual(1500);
      expect(profile.colorTemperature).toBeLessThanOrEqual(6500);
      expect(profile.rationale.length).toBeGreaterThan(10);
    }
  });

  it("keeps calming states dimmer and warmer than energising ones", () => {
    expect(DEFAULT_PROFILES.tired.brightness).toBeLessThan(DEFAULT_PROFILES.focused.brightness);
    expect(DEFAULT_PROFILES.tired.colorTemperature).toBeLessThan(DEFAULT_PROFILES.focused.colorTemperature);
    expect(DEFAULT_PROFILES.anxious.effect).toBe("breathe");
  });

  it("applies user overrides on top of the defaults", () => {
    const profile = resolveProfile("happy", { happy: { name: "Party", brightness: 0.3, color: { h: 300 } } });
    expect(profile.name).toBe("Party");
    expect(profile.brightness).toBe(0.3);
    expect(profile.color.h).toBe(300);
    expect(profile.color.s).toBe(DEFAULT_PROFILES.happy.color.s);
    expect(profile.rationale).toBe("Personalised by you.");
  });
});
