# Poster Analyzer API

## Overview

`POST /api/analyze` reads an event poster image for visually impaired and low-vision SFSU students. It uses Gemini vision to extract event details and describe the poster. The API is stateless: the app stores nothing.

## Request

- Header: `Content-Type: application/json`
- Body:

```json
{ "image": "data:image/jpeg;base64,..." }
```

- Allowed types: jpeg, png, webp only. Decoded image size must be 3 MB or less (base64 inflates ~33%, and Vercel caps request bodies at ~4.5 MB).
- Target 1.5 MB or less after resize/re-encode: resize to about 1600px on the longest side and re-encode to JPEG (quality ~0.85) via canvas. This also strips EXIF/GPS metadata.
- A body over the platform limit may be rejected before our code runs, with a non-JSON 413. Clients must handle non-JSON responses and network failures with a generic friendly message.
- HEIC is decoded in the browser (natively in Safari, via `heic-to` elsewhere) and re-encoded to JPEG, so the server never receives HEIC.
- Same-origin requests only.

## Success (200)

All fields are strings, and `"Not found"` is used when something is not clearly visible, except where noted.

| Field | Description |
|---|---|
| is_poster | boolean. `false` if the image is not an event poster (see below) |
| event_name | Name of the event |
| date | Event date |
| time | Event time |
| location | Event location |
| registration | How or whether to register |
| description | What the event is about |
| host_organization | Hosting organization |
| contact_or_link | Contact info or link |
| visual_description | Short description of imagery and layout for blind users; people described only generally |
| confidence_notes | Warnings about unclear or blurry text |
| summary | 2-4 plain sentences for display and Read Aloud |
| demo | boolean. `true` for sample results |

Shape of a real analysis (demo: false). Demo responses are identical but with demo: true. Mock, not real data:

```json
{
  "is_poster": true,
  "event_name": "Example Club Career Mixer",
  "date": "Friday, January 10",
  "time": "5:00 PM - 7:00 PM",
  "location": "Not found",
  "registration": "Sign up online",
  "description": "An evening of networking between students and local professionals, with snacks provided.",
  "host_organization": "Example Club",
  "contact_or_link": "example.org/signup",
  "visual_description": "A blue poster with a large title at the top, a row of illustrated briefcases in the middle, and event details in white text along the bottom.",
  "confidence_notes": "The location line is blurry and could not be read.",
  "summary": "Example Club is hosting a Career Mixer on Friday, January 10, from 5:00 PM to 7:00 PM. Students can meet local professionals. Sign up at example.org/signup. The location was not readable.",
  "demo": false
}
```

### Not a poster (`is_poster: false`)

All other string fields are `"Not found"`, except `summary` = "This image doesn't appear to be an event poster." (`visual_description` may still describe the image). The UI should show the summary message.

```json
{
  "is_poster": false,
  "event_name": "Not found",
  "date": "Not found",
  "time": "Not found",
  "location": "Not found",
  "registration": "Not found",
  "description": "Not found",
  "host_organization": "Not found",
  "contact_or_link": "Not found",
  "visual_description": "A photo of a dog sitting on a grassy lawn.",
  "confidence_notes": "Not found",
  "summary": "This image doesn't appear to be an event poster.",
  "demo": false
}
```

## Errors

Shape: `{ "error": { "code": "...", "message": "..." } }`

| code | HTTP | when |
|---|---|---|
| BAD_REQUEST | 400 | Malformed JSON, missing image, or content type is not `application/json` |
| FORBIDDEN_ORIGIN | 403 | Cross-origin request, or missing `Origin` header |
| TOO_LARGE | 413 | Image exceeds the size limit, or body exceeds ~4.5 MB |
| UNSUPPORTED_TYPE | 415 | Not jpeg/png/webp, or file bytes do not match the declared type |
| RATE_LIMITED | 429 | AI quota hit; offer demo mode |
| CONFIG_ERROR | 500 | Server misconfigured |
| UPSTREAM_ERROR | 502 | AI service failed |
| INVALID_AI_RESPONSE | 502 | AI returned an unusable response |
| UPSTREAM_TIMEOUT | 504 | AI service timed out |
| UPSTREAM_BUSY | 503 | Google AI overloaded (transient) |

Example (RATE_LIMITED):

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests right now. Please wait a minute and try again, or view a sample result."
  }
}
```

## POST /api/ask

Answers one follow-up question about a poster image. Stateless: re-send the image with every call.

- Body: `{ "image": "data:image/jpeg;base64,...", "question": "Is there free food?" }`
- `image`: same data URL rules as analyze. `question`: 1-300 characters (over 300 is rejected, never truncated).
- Success (200): `{ "answer": "..." }`. Plain text, at most 500 characters, 1-3 short sentences. Returns `"The poster doesn't say."` when the poster doesn't state it.
- Errors: same shape and table as above. `BAD_REQUEST` also covers a missing, empty, non-string, or over-300-character question.
- Same-origin only. Responses send `Cache-Control: no-store`.
- No `?demo`: hide the question box on demo results.
- The question is sent to Google AI along with the image.
- Frontend: render the answer as plain text in an `aria-live` region. Show the `RATE_LIMITED` message normally.

## POST /api/speak

Turns text into natural speech (Gemini TTS, voice "Charon") for Read Aloud. Stateless.

- Body: `{ "text": "..." }`. 1-400 characters after cleanup (over 400 is rejected, never truncated). Longer text (e.g. `summary` + `confidence_notes`) must be split into sentence chunks, one request each; play the first while fetching the next.
- Success (200): `Content-Type: audio/wav` binary (24 kHz mono 16-bit PCM, about 48 KB per second of speech). Not JSON.
- Errors: same JSON shape and table as above. `BAD_REQUEST` covers a missing, empty, non-string, or over-400-character text.
- Same-origin only. Responses send `Cache-Control: no-store`.
- Takes about 4-7 s per chunk and uses Gemini quota (one request per chunk): cache the audio per result instead of re-requesting on replay. Do not retry; fall back instead.
- Frontend: if it fails (e.g. `RATE_LIMITED`), fall back to the browser's `speechSynthesis` and say so in an `aria-live` region.

## Demo mode

`POST /api/analyze?demo=1` returns a pre-verified sample with `demo: true` and makes no AI call. No request body is required. The same-origin check still applies (can return `FORBIDDEN_ORIGIN`); otherwise it always returns 200. The UI must visibly label it "Sample result". Offer it after `RATE_LIMITED`.

## Privacy & caching

- Responses send `Cache-Control: no-store`.
- The app does not store or log images or results. The hosting platform (Vercel) keeps standard request logs (e.g. timestamps, status codes) outside our control.
- The free Gemini tier may use submitted content to improve Google products. Do not upload sensitive images.

## Frontend notes

- Show a short pre-upload notice: "Images are sent to Google's AI for analysis. Don't upload images with sensitive personal information."
- Render all fields as plain text: no `dangerouslySetInnerHTML`, no auto-linking.
- Put `error.message` into an `aria-live` region (messages are written to be screen-reader-friendly).
- Branch on `error.code`, never on message text.
- Retry at most once on UPSTREAM_ERROR / UPSTREAM_TIMEOUT / UPSTREAM_BUSY / INVALID_AI_RESPONSE.
- Set a client-side timeout of ~35s.
- For CONFIG_ERROR show a generic "Service is temporarily unavailable".
- Handle image decode failures before upload with a clear message asking for a JPEG, PNG, or HEIC photo.
- Show: "AI can make mistakes. Verify the date, time, and location with the event organizer."
- Never import anything from `lib/gemini.ts` in client components (`server-only` will fail the build).
