import { hslToRgb } from "../color";
import type { LightState } from "../engine";
import { timed, type ApplyResult, type DriverInfo, type LightDriver } from "./types";

export interface WebhookConfig {
  url: string;
  fetchImpl?: typeof fetch;
}

/**
 * Generic driver that POSTs every light state as JSON to a URL. Use it to bridge into
 * Home Assistant, Node-RED, an ESP32 LED controller, or anything else with an HTTP API.
 */
export class WebhookDriver implements LightDriver {
  readonly id = "webhook" as const;
  readonly name = "Webhook";
  private readonly fetchImpl: typeof fetch;
  private lastError: string | undefined;

  constructor(private readonly config: WebhookConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async info(): Promise<DriverInfo> {
    const ready = Boolean(this.config.url);
    return {
      id: this.id,
      name: this.name,
      description: "POSTs each light state as JSON to a URL of your choice.",
      ready,
      detail: ready ? this.lastError ?? this.config.url : "Set LIGHT_WEBHOOK_URL to enable.",
    };
  }

  static toPayload(state: LightState) {
    return {
      emotion: state.emotion,
      scene: state.sceneName,
      rgb: hslToRgb(state.color),
      hex: state.hex,
      brightness: state.brightness,
      colorTemperature: state.colorTemperature,
      transitionMs: state.transitionMs,
      effect: state.effect,
      effectPeriodMs: state.effectPeriodMs,
      updatedAt: state.updatedAt,
    };
  }

  async apply(state: LightState): Promise<ApplyResult> {
    const result = await timed(async () => {
      const response = await this.fetchImpl(this.config.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(WebhookDriver.toPayload(state)),
      });
      if (!response.ok) throw new Error(`Webhook responded ${response.status}`);
    });
    this.lastError = result.ok ? undefined : result.error;
    return result;
  }
}
