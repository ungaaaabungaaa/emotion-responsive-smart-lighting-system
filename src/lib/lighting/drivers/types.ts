import type { LightState } from "../engine";

export type DriverId = "simulator" | "hue" | "webhook";

export interface DriverInfo {
  id: DriverId;
  name: string;
  description: string;
  /** Whether the driver is configured well enough to be used. */
  ready: boolean;
  /** Human-readable configuration hints or the last error. */
  detail?: string;
}

export interface ApplyResult {
  ok: boolean;
  /** Milliseconds the driver took to push the state. */
  latencyMs: number;
  error?: string;
}

/** Anything that can physically (or virtually) render a LightState. */
export interface LightDriver {
  readonly id: DriverId;
  readonly name: string;
  info(): Promise<DriverInfo>;
  apply(state: LightState): Promise<ApplyResult>;
}

export async function timed(fn: () => Promise<void>): Promise<ApplyResult> {
  const started = Date.now();
  try {
    await fn();
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
