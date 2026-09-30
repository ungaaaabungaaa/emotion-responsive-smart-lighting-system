import type { LightState } from "../engine";
import { timed, type ApplyResult, type DriverInfo, type LightDriver } from "./types";

/**
 * In-memory driver used for development, demos and tests. It records every state it
 * receives so the UI can render a virtual room and the tests can assert on output.
 */
export class SimulatorDriver implements LightDriver {
  readonly id = "simulator" as const;
  readonly name = "Virtual room";
  private last: LightState | null = null;
  private readonly log: LightState[] = [];

  async info(): Promise<DriverInfo> {
    return {
      id: this.id,
      name: this.name,
      description: "Renders the lights in the browser. No hardware required.",
      ready: true,
      detail: this.last ? `Last scene: ${this.last.sceneName}` : "Waiting for the first reading.",
    };
  }

  async apply(state: LightState): Promise<ApplyResult> {
    return timed(async () => {
      this.last = state;
      this.log.push(state);
      if (this.log.length > 100) this.log.shift();
    });
  }

  lastState(): LightState | null {
    return this.last;
  }

  applied(): LightState[] {
    return this.log;
  }
}
