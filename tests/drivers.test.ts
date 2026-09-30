import { describe, expect, it, vi } from "vitest";
import { HueDriver, LightingEngine, SimulatorDriver, WebhookDriver, kelvinToMired, rgbToXy } from "@/lib/lighting";
import { LightingSystem } from "@/lib/server/system";

describe("colour conversions", () => {
  it("maps white near the D65 white point", () => {
    const [x, y] = rgbToXy({ r: 255, g: 255, b: 255 });
    expect(x).toBeCloseTo(0.3127, 1);
    expect(y).toBeCloseTo(0.329, 1);
  });

  it("clamps mired to the Hue range", () => {
    expect(kelvinToMired(2000)).toBe(500);
    expect(kelvinToMired(6500)).toBe(154);
  });
});

describe("SimulatorDriver", () => {
  it("records applied states", async () => {
    const driver = new SimulatorDriver();
    const state = new LightingEngine().override("calm");
    const result = await driver.apply(state);
    expect(result.ok).toBe(true);
    expect(driver.lastState()?.emotion).toBe("calm");
    expect((await driver.info()).ready).toBe(true);
  });
});

describe("HueDriver", () => {
  it("translates a light state into a bridge payload", () => {
    const state = new LightingEngine({ preferences: { blend: false } }).override("anxious");
    const payload = HueDriver.toHuePayload(state);
    expect(payload.on).toBe(true);
    expect(payload.bri).toBe(Math.round(0.4 * 254));
    expect(payload.transitiontime).toBe(30);
    expect(payload.xy).toHaveLength(2);
  });

  it("PUTs to every configured light", async () => {
    const fetchImpl = vi.fn(async (..._args: Parameters<typeof fetch>) => new Response("[]", { status: 200 }));
    const driver = new HueDriver({ host: "bridge.local", username: "abc", lightIds: ["1", "2"], fetchImpl });
    const result = await driver.apply(new LightingEngine().override("happy"));
    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0]).toBe("http://bridge.local/api/abc/lights/1/state");
  });

  it("reports failures without throwing", async () => {
    const fetchImpl = vi.fn(async (..._args: Parameters<typeof fetch>) => new Response("nope", { status: 500 }));
    const driver = new HueDriver({ host: "bridge.local", username: "abc", lightIds: ["1"], fetchImpl });
    const result = await driver.apply(new LightingEngine().override("happy"));
    expect(result.ok).toBe(false);
    expect(result.error).toContain("500");
    expect((await driver.info()).detail).toContain("500");
  });

  it("is not ready without credentials", async () => {
    const driver = new HueDriver({ host: "", username: "", lightIds: [] });
    expect((await driver.info()).ready).toBe(false);
  });
});

describe("WebhookDriver", () => {
  it("POSTs a JSON payload", async () => {
    const fetchImpl = vi.fn(async (..._args: Parameters<typeof fetch>) => new Response("ok", { status: 200 }));
    const driver = new WebhookDriver({ url: "https://example.test/hook", fetchImpl });
    await driver.apply(new LightingEngine().override("focused"));
    const [, init] = fetchImpl.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.emotion).toBe("focused");
    expect(body.rgb).toEqual(expect.objectContaining({ r: expect.any(Number) }));
  });
});

describe("LightingSystem", () => {
  it("defaults to the simulator and routes readings through it", async () => {
    const system = new LightingSystem({} as NodeJS.ProcessEnv);
    const result = await system.submitReading({ text: "I am so relaxed and cozy tonight" });
    expect(result.reading.emotion).toBe("calm");
    expect(result.apply.ok).toBe(true);
    const snapshot = await system.snapshot();
    expect(snapshot.driver.id).toBe("simulator");
    expect(snapshot.history).toHaveLength(1);
  });

  it("rejects invalid readings", async () => {
    const system = new LightingSystem({} as NodeJS.ProcessEnv);
    await expect(system.submitReading({ emotion: "ecstatic" })).rejects.toThrow(/valid `emotion`/);
  });

  it("refuses to select an unconfigured driver", async () => {
    const system = new LightingSystem({} as NodeJS.ProcessEnv);
    await expect(system.selectDriver("hue")).rejects.toThrow(/HUE_BRIDGE_HOST/);
  });
});
