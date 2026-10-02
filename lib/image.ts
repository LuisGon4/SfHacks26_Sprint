import { AppError } from "./errors";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

const IMAGE_TYPES: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  "image/png": (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/webp": (b) => startsWith(b, ascii("RIFF")) && startsWith(b, ascii("WEBP"), 8),
};

const DATA_URL = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/]+={0,2})$/;

export function parseImageDataUrl(v: unknown): { mimeType: string; base64: string } {
  const m = typeof v === "string" ? DATA_URL.exec(v) : null;
  if (!m || m[2].length % 4 !== 0) throw new AppError("BAD_REQUEST");
  const [, mimeType, base64] = m;
  if (!Object.hasOwn(IMAGE_TYPES, mimeType)) throw new AppError("UNSUPPORTED_TYPE");
  const matches = IMAGE_TYPES[mimeType];
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  if (Math.floor((base64.length * 3) / 4) - padding > MAX_IMAGE_BYTES) throw new AppError("TOO_LARGE");
  // 16 base64 chars decode to 12 bytes, enough for every signature above.
  const head = Buffer.from(base64.slice(0, 16), "base64");
  if (!matches(head)) throw new AppError("UNSUPPORTED_TYPE");
  return { mimeType, base64 };
}
