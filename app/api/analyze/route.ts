import { analyzePoster } from "@/lib/gemini";
import { checkOrigin, errorResponse, json, readJson } from "@/lib/http";
import { parseImageDataUrl } from "@/lib/image";

export const maxDuration = 30;

const TIMEOUT_MS = 25_000;
const MAX_BODY_BYTES = 4.5 * 1024 * 1024;

export async function POST(req: Request): Promise<Response> {
  try {
    checkOrigin(req);
    // Step 6: if new URL(req.url).searchParams.get("demo") === "1", return the demo sample here.
    const body = (await readJson(req, MAX_BODY_BYTES)) as { image?: unknown } | null;
    const { mimeType, base64 } = parseImageDataUrl(body?.image);
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(TIMEOUT_MS)]);
    return json({ ...(await analyzePoster(base64, mimeType, signal)), demo: false });
  } catch (e) {
    return errorResponse(e);
  }
}
