export type ErrorCode = "BAD_REQUEST" | "FORBIDDEN_ORIGIN" | "TOO_LARGE" | "UNSUPPORTED_TYPE" | "CONFIG_ERROR" | "RATE_LIMITED" | "UPSTREAM_TIMEOUT" | "UPSTREAM_BUSY" | "UPSTREAM_ERROR" | "INVALID_AI_RESPONSE";

export const CODE_STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  FORBIDDEN_ORIGIN: 403,
  TOO_LARGE: 413,
  UNSUPPORTED_TYPE: 415,
  CONFIG_ERROR: 500,
  RATE_LIMITED: 429,
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_BUSY: 503,
  UPSTREAM_ERROR: 502,
  INVALID_AI_RESPONSE: 502,
};

export const CODE_MESSAGE: Record<ErrorCode, string> = {
  BAD_REQUEST: "We couldn't understand that request. Please check your image and question and try again.",
  FORBIDDEN_ORIGIN: "This request isn't allowed from here.",
  TOO_LARGE: "That image is too large. Please choose a smaller one (under 3 MB).",
  UNSUPPORTED_TYPE: "Please upload a JPEG, PNG, or WebP image.",
  CONFIG_ERROR: "The service is temporarily unavailable. Please try again later.",
  RATE_LIMITED: "Too many requests right now. Please wait a minute and try again, or view a sample result.",
  UPSTREAM_TIMEOUT: "Reading the poster took too long. Please try again.",
  UPSTREAM_BUSY: "The reader is busy right now. Please try again in a few seconds.",
  UPSTREAM_ERROR: "Something went wrong while reading the poster. Please try again.",
  INVALID_AI_RESPONSE: "We couldn't read this poster reliably. Please try again or use a clearer photo.",
};

export class AppError extends Error {
  constructor(readonly code: ErrorCode) {
    super(CODE_MESSAGE[code]);
    this.name = "AppError";
  }
}
