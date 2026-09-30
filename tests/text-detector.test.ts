import { describe, expect, it } from "vitest";
import { analyzeText, readingFromText } from "@/lib/emotion";

describe("analyzeText", () => {
  it("detects clear emotions", () => {
    expect(analyzeText("I feel so happy and grateful today!").emotion).toBe("happy");
    expect(analyzeText("I'm exhausted and just want to sleep").emotion).toBe("tired");
    expect(analyzeText("This deadline is stressing me out, I'm so anxious").emotion).toBe("anxious");
    expect(analyzeText("Time for some deep work, need to focus").emotion).toBe("focused");
  });

  it("falls back to neutral for unrelated text", () => {
    const result = analyzeText("The train leaves at nine.");
    expect(result.emotion).toBe("neutral");
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("handles negation", () => {
    const result = analyzeText("I am not happy about this");
    expect(result.scores.happy).toBeLessThan(0);
    expect(result.emotion).toBe("neutral");
  });

  it("boosts intensifiers", () => {
    const plain = analyzeText("I am sad");
    const intense = analyzeText("I am really sad");
    expect(intense.scores.sad).toBeGreaterThan(plain.scores.sad);
  });

  it("produces a reading tagged with the text source", () => {
    const reading = readingFromText("what a wonderful surprise, wow!", 123);
    expect(reading.source).toBe("text");
    expect(reading.timestamp).toBe(123);
    expect(reading.confidence).toBeGreaterThan(0.5);
  });
});
