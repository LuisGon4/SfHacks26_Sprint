import { analyzePoster } from "@/lib/gemini";
import { MAX_BODY_BYTES, TIMEOUT_MS, checkOrigin, errorResponse, json, readJson } from "@/lib/http";
import { parseImageDataUrl } from "@/lib/image";
import type { PosterResult } from "@/lib/posterSchema";
import demoFixture from "@/lib/demoFixture.json";

export const maxDuration = 30;

// A real, verified run on the sample flyer, served only on ?demo=1.
const DEMO_RESULT: PosterResult = demoFixture;

export async function POST(req: Request): Promise<Response> {
  try {
    checkOrigin(req);
    if (new URL(req.url).searchParams.get("demo") === "1") return json({ ...DEMO_RESULT, demo: true });
    const body = (await readJson(req, MAX_BODY_BYTES)) as { image?: unknown } | null;
    const { mimeType, base64 } = parseImageDataUrl(body?.image);
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(TIMEOUT_MS)]);
    return json({ ...(await analyzePoster(base64, mimeType, signal)), demo: false });
  } catch (e) {
    return errorResponse(e);
  }
}
