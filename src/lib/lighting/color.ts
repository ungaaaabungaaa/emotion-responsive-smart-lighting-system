import { clamp } from "@/lib/emotion/types";

export interface HSL {
  /** Hue in degrees [0, 360). */
  h: number;
  /** Saturation in [0, 1]. */
  s: number;
  /** Lightness in [0, 1]. */
  l: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

export function hslToCss({ h, s, l }: HSL): string {
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

/** Interpolates hue along the shortest arc of the color wheel. */
export function lerpHue(a: number, b: number, t: number): number {
  const delta = ((((b - a) % 360) + 540) % 360) - 180;
  return (((a + delta * t) % 360) + 360) % 360;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpHsl(a: HSL, b: HSL, t: number): HSL {
  return {
    h: lerpHue(a.h, b.h, t),
    s: lerp(a.s, b.s, t),
    l: lerp(a.l, b.l, t),
  };
}

/**
 * Converts an RGB color to CIE 1931 xy chromaticity, the color space used by
 * Philips Hue and most Zigbee bulbs.
 */
export function rgbToXy({ r, g, b }: RGB): [number, number] {
  const gamma = (v: number) => {
    const c = v / 255;
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };
  const rl = gamma(r);
  const gl = gamma(g);
  const bl = gamma(b);
  const X = rl * 0.664511 + gl * 0.154324 + bl * 0.162028;
  const Y = rl * 0.283881 + gl * 0.668433 + bl * 0.047685;
  const Z = rl * 0.000088 + gl * 0.07231 + bl * 0.986039;
  const sum = X + Y + Z;
  if (sum === 0) return [0.3127, 0.329];
  return [Number((X / sum).toFixed(4)), Number((Y / sum).toFixed(4))];
}

/** Converts a color temperature in kelvin to the mired scale used by Hue (153–500). */
export function kelvinToMired(kelvin: number): number {
  return Math.round(clamp(1_000_000 / kelvin, 153, 500));
}
