import { Type, type Schema } from "@google/genai";

export const NOT_FOUND = "Not found";
export const NON_POSTER_SUMMARY = "This image doesn't appear to be an event poster.";

export const STRING_FIELDS = ["event_name", "date", "time", "location", "registration", "description", "host_organization", "contact_or_link", "visual_description", "confidence_notes", "summary"] as const;
export type StringField = (typeof STRING_FIELDS)[number];

export type PosterResult = { is_poster: boolean } & Record<StringField, string>;

const LONG_FIELDS: StringField[] = ["summary", "description", "visual_description"];
const MAX_LEN = Object.fromEntries(
  STRING_FIELDS.map((k) => [k, LONG_FIELDS.includes(k) ? 1000 : 300]),
) as Record<StringField, number>;

const FIELD_DOCS: Record<StringField, string> = {
  event_name: "Name or title of the event.",
  date: "Date(s) of the event.",
  time: "Start/end time of the event.",
  location: "Venue or address of the event.",
  registration: "How to register or buy tickets, and any deadlines.",
  description: "Short description of what the event is about.",
  host_organization: "Organization or people hosting the event.",
  contact_or_link: "Contact info, URL, or social handle shown.",
  visual_description: "Short description of imagery and layout for blind users. Describe people only in general terms; never identify anyone.",
  confidence_notes: "Note any blurry, ambiguous, or partially visible text.",
  summary: "2-4 plain sentences restating only the extracted fields.",
};

const stringProp = (k: StringField): Schema => ({
  type: Type.STRING,
  description: `${FIELD_DOCS[k]} Keep under ${MAX_LEN[k]} characters. Use "${NOT_FOUND}" if not clearly visible.`,
});

export const posterResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    is_poster: { type: Type.BOOLEAN, description: "True only if the image is an event poster/flyer." },
    ...Object.fromEntries(STRING_FIELDS.map((k) => [k, stringProp(k)])),
  },
  required: ["is_poster", ...STRING_FIELDS],
  propertyOrdering: ["is_poster", ...STRING_FIELDS],
};

// Strip invisible/control chars (keeping ZWJ), collapse whitespace, cap length by code points.
function clean(v: string, max: number): string {
  const s = v
    .replace(/[\u00AD\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069]/g, "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const t = Array.from(s).slice(0, max).join("").toWellFormed().replace(/\u200D+$/, "").trim();
  return t || NOT_FOUND;
}

export function validatePosterResult(raw: unknown): PosterResult | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.is_poster !== "boolean") return null;
  const out = { is_poster: r.is_poster } as PosterResult;
  // Missing fields are tolerated; wrongly-typed ones reject the whole result.
  for (const k of STRING_FIELDS) {
    const v = r[k];
    if (v == null) out[k] = NOT_FOUND;
    else if (typeof v !== "string") return null;
    else out[k] = clean(v, MAX_LEN[k]);
  }
  // Non-posters keep only visual_description; everything else is blanked.
  if (!out.is_poster) {
    for (const k of STRING_FIELDS) if (k !== "visual_description") out[k] = NOT_FOUND;
    out.summary = NON_POSTER_SUMMARY;
  }
  return out;
}
