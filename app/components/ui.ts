// Shared styles. Shape comes from fills and shadows, not rules; touch targets stay at least 48px tall.
const BASE = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:opacity-50";

export const BTN_PRIMARY = `${BASE} bg-purple px-8 text-lg text-white hover:bg-purple-deep dark:bg-gold dark:text-purple-deep dark:hover:bg-gold/90`;
export const BTN_OUTLINE = `${BASE} border border-line bg-surface px-8 text-lg text-fg hover:border-fg`;
export const BTN_GOLD = `${BASE} bg-gold px-8 py-3 text-xl text-purple-deep hover:bg-gold/90`;
export const BTN_CHIP = `${BASE} bg-ground px-5 hover:bg-line`;
export const BTN_LINK = "inline-flex min-h-12 items-center gap-2 text-lg font-bold hover:underline focus-visible:underline underline-offset-4 disabled:opacity-50";

// Text, date, and time fields.
export const INPUT = "min-h-12 rounded-full border border-line bg-surface px-6 text-lg shadow-card";

// Page width wrapper; sections own it so bands can run edge to edge.
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";
// Dark centered hero band; cards placed after it use OVERLAP to ride up over its bottom edge.
export const BAND = "on-dark bg-band pt-16 pb-32 text-center text-white sm:pt-24 sm:pb-40";
export const BAND_TITLE = "max-w-4xl text-5xl leading-tight font-extrabold text-balance sm:text-6xl";
export const OVERLAP = "-mt-20 sm:-mt-24";
export const CARD = "rounded-3xl bg-surface p-6 shadow-card sm:p-8";

// Filled box for warnings and errors.
export const CALLOUT = "rounded-2xl bg-callout p-5 text-lg text-callout-fg";
