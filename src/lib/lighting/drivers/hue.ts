import { hslToRgb, kelvinToMired, rgbToXy } from "../color";
import type { LightState } from "../engine";
import { timed, type ApplyResult, type DriverInfo, type LightDriver } from "./types";

export interface HueConfig {
  host: string;
  username: string;
  /** Light ids to control; empty means every light on the bridge. */
  lightIds: string[];
  fetchImpl?: typeof fetch;
}

/**
 * Philips Hue bridge driver using the local CLIP v1 API. It converts the engine's HSL
 * colour to CIE xy (the bridge's native colour space) and maps transition time to the
 * bridge's 100 ms units.
 */
export class HueDriver implements LightDriver {
  readonly id = "hue" as const;
  readonly name = "Philips Hue";
  private readonly fetchImpl: typeof fetch;
  private lastError: string | undefined;

  constructor(private readonly config: HueConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private get base(): string {
    return `http://${this.config.host}/api/${this.config.username}`;
  }

  async info(): Promise<DriverInfo> {
    const ready = Boolean(this.config.host && this.config.username);
    return {
      id: this.id,
      name: this.name,
      description: "Controls Hue bulbs through the local bridge API.",
      ready,
      detail: ready
        ? this.lastError ?? `Bridge ${this.config.host}`
        : "Set HUE_BRIDGE_HOST and HUE_USERNAME to enable.",
    };
  }

  /** Builds the JSON body the bridge expects for a given light state. */
  static toHuePayload(state: LightState) {
    const rgb = hslToRgb(state.color);
    return {
      on: state.brightness > 0,
      bri: Math.max(1, Math.round(state.brightness * 254)),
      xy: rgbToXy(rgb),
      ct: kelvinToMired(state.colorTemperature),
      transitiontime: Math.round(state.transitionMs / 100),
      alert: state.effect === "pulse" ? "select" : "none",
      effect: "none",
    };
  }

  async apply(state: LightState): Promise<ApplyResult> {
    const result = await timed(async () => {
      let ids = this.config.lightIds;
      if (ids.length === 0) {
        const response = await this.fetchImpl(`${this.base}/lights`);
        if (!response.ok) throw new Error(`Bridge responded ${response.status}`);
        ids = Object.keys((await response.json()) as Record<string, unknown>);
      }
      const payload = JSON.stringify(HueDriver.toHuePayload(state));
      await Promise.all(
        ids.map(async (id) => {
          const response = await this.fetchImpl(`${this.base}/lights/${id}/state`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: payload,
          });
          if (!response.ok) throw new Error(`Light ${id} responded ${response.status}`);
        }),
      );
    });
    this.lastError = result.ok ? undefined : result.error;
    return result;
  }
}
