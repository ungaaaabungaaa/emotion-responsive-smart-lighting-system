import { isEmotion, readingFromText, type EmotionReading, type EmotionSource } from "@/lib/emotion";
import {
  HueDriver,
  LightingEngine,
  SimulatorDriver,
  WebhookDriver,
  type ApplyResult,
  type DriverId,
  type DriverInfo,
  type LightDriver,
  type LightState,
  type UserPreferences,
} from "@/lib/lighting";

export interface SystemSnapshot {
  state: LightState;
  preferences: UserPreferences;
  history: EmotionReading[];
  driver: DriverInfo;
  drivers: DriverInfo[];
  lastApply: ApplyResult | null;
}

/**
 * Wires the engine to the drivers. There is a single instance per server process,
 * kept on `globalThis` so Next.js hot reloads in development do not reset it.
 */
export class LightingSystem {
  readonly engine = new LightingEngine();
  private readonly drivers = new Map<DriverId, LightDriver>();
  private activeDriver: DriverId;
  private lastApply: ApplyResult | null = null;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.drivers.set("simulator", new SimulatorDriver());
    this.drivers.set(
      "hue",
      new HueDriver({
        host: env.HUE_BRIDGE_HOST ?? "",
        username: env.HUE_USERNAME ?? "",
        lightIds: (env.HUE_LIGHT_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      }),
    );
    this.drivers.set("webhook", new WebhookDriver({ url: env.LIGHT_WEBHOOK_URL ?? "" }));

    const requested = env.LIGHT_DRIVER as DriverId | undefined;
    this.activeDriver = requested && this.drivers.has(requested) ? requested : "simulator";
  }

  get driver(): LightDriver {
    return this.drivers.get(this.activeDriver)!;
  }

  async selectDriver(id: DriverId): Promise<DriverInfo> {
    const driver = this.drivers.get(id);
    if (!driver) throw new Error(`Unknown driver "${id}"`);
    const info = await driver.info();
    if (!info.ready) throw new Error(info.detail ?? `Driver "${id}" is not configured`);
    this.activeDriver = id;
    this.lastApply = await driver.apply(this.engine.getState());
    return info;
  }

  async submitReading(input: { emotion?: unknown; confidence?: unknown; source?: unknown; text?: unknown }) {
    let reading: EmotionReading;
    if (typeof input.text === "string" && input.text.trim()) {
      reading = readingFromText(input.text);
    } else {
      if (!isEmotion(input.emotion)) throw new Error("Provide a valid `emotion` or some `text`.");
      const confidence = typeof input.confidence === "number" ? input.confidence : 1;
      const source: EmotionSource = ["camera", "text", "manual", "api"].includes(String(input.source))
        ? (input.source as EmotionSource)
        : "api";
      reading = { emotion: input.emotion, confidence, source, timestamp: Date.now() };
    }
    const state = this.engine.ingest(reading);
    this.lastApply = await this.driver.apply(state);
    return { reading, state, apply: this.lastApply };
  }

  async updatePreferences(update: Partial<UserPreferences>) {
    const state = this.engine.setPreferences(update);
    this.lastApply = await this.driver.apply(state);
    return { preferences: this.engine.getPreferences(), state, apply: this.lastApply };
  }

  async snapshot(): Promise<SystemSnapshot> {
    const drivers = await Promise.all([...this.drivers.values()].map((d) => d.info()));
    return {
      state: this.engine.getState(),
      preferences: this.engine.getPreferences(),
      history: this.engine.getHistory().slice(-60),
      driver: drivers.find((d) => d.id === this.activeDriver)!,
      drivers,
      lastApply: this.lastApply,
    };
  }
}

const globalStore = globalThis as unknown as { __lightingSystem?: LightingSystem };

export function getSystem(): LightingSystem {
  if (!globalStore.__lightingSystem) {
    globalStore.__lightingSystem = new LightingSystem();
  }
  return globalStore.__lightingSystem;
}
