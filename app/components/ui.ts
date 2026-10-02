// Shared button styles; touch targets stay at least 48px tall.
const BASE = "inline-flex min-h-12 items-center justify-center rounded-full font-bold disabled:opacity-50";

export const BTN_PRIMARY = `${BASE} bg-purple px-8 text-lg text-white`;
export const BTN_OUTLINE = `${BASE} border-2 border-purple bg-surface px-8 text-lg text-fg dark:border-gold`;
export const BTN_GOLD = `${BASE} w-full gap-3 bg-gold px-6 py-3 text-xl text-purple-deep`;
export const BTN_CHIP = `${BASE} border-2 border-line px-4`;
export const BTN_LINK = "min-h-12 text-lg font-bold underline decoration-2 underline-offset-4 disabled:opacity-50";

// Gold-edged box for warnings and errors.
export const CALLOUT = "rounded-2xl border-l-8 border-gold bg-callout p-5 text-lg text-callout-fg";
