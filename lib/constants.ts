// Dependency-free values shared by server routes and client components.
export const NOT_FOUND = "Not found";
export const MAX_QUESTION_LEN = 300;
// Per /api/speak request: ~5 KB of WAV per char, so ~2 MB and well under the 25 s timeout.
// Longer text is split into sentence chunks by the client.
export const MAX_SPEECH_LEN = 400;
