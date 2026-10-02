const MAX_SIDE = 1600;
const QUALITY = 0.85;

export const DECODE_ERROR = "Couldn't open that image. Please use a JPEG, PNG, or HEIC photo.";

type Decoded = CanvasImageSource & { width: number; height: number };

async function decodeNative(file: File): Promise<Decoded> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback for browsers whose createImageBitmap can't decode the format.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

// Safari opens HEIC natively; elsewhere load the (large) decoder only when a HEIC file shows up.
async function decode(file: File): Promise<Decoded> {
  try {
    return await decodeNative(file);
  } catch (err) {
    const { heicTo, isHeic } = await import("heic-to/next");
    if (!(await isHeic(file))) throw err;
    return heicTo({ blob: file, type: "bitmap", options: { imageOrientation: "from-image" } });
  }
}

// Resize to <=1600px and re-encode as JPEG; re-encoding also strips EXIF/GPS.
export async function prepareImage(file: File): Promise<string> {
  let src;
  try {
    src = await decode(file);
  } catch {
    throw new Error(DECODE_ERROR);
  }
  try {
    if (!src.width || !src.height) throw new Error(DECODE_ERROR);
    const scale = Math.min(1, MAX_SIDE / Math.max(src.width, src.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(src.width * scale));
    canvas.height = Math.max(1, Math.round(src.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(DECODE_ERROR);
    ctx.fillStyle = "#fff"; // transparent PNGs would otherwise turn black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", QUALITY);
  } finally {
    if ("close" in src) src.close();
  }
}
