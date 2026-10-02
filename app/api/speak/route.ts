import { parseText } from "@/lib/askSchema";
import { MAX_SPEECH_LEN } from "@/lib/constants";
import { synthesizeSpeech } from "@/lib/gemini";
import { NO_STORE, TIMEOUT_MS, checkOrigin, errorResponse, readJson } from "@/lib/http";

export const maxDuration = 30;

const MAX_SPEAK_BODY_BYTES = 16 * 1024; // text only, no image

export async function POST(req: Request): Promise<Response> {
  try {
    checkOrigin(req);
    const body = (await readJson(req, MAX_SPEAK_BODY_BYTES)) as { text?: unknown } | null;
    const text = parseText(body?.text, MAX_SPEECH_LEN);
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(TIMEOUT_MS)]);
    const wav = await synthesizeSpeech(text, signal);
    return new Response(new Uint8Array(wav), { headers: { ...NO_STORE, "Content-Type": "audio/wav" } });
  } catch (e) {
    return errorResponse(e);
  }
}
