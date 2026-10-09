import "server-only";

// Ribera's coral, the colour of every line in the template's own illustrations.
const CORAL = { r: 0xdd, g: 0x3e, b: 0x3e };
const SIZE = 1024;

// Luminance of the coral itself (about 110) and of paper (255). A pixel at or
// below LINE_LUM is ink; one at or above PAPER_LUM is background.
const LINE_LUM = 150;
const PAPER_LUM = 235;

/**
 * Makes a generated line drawing exactly Ribera's colour: every pixel becomes #DD3E3E and only its
 * "inkness" (how dark it is, times its own transparency) is kept as opacity. That also drops the
 * pale washes the model sometimes adds behind the figures, and keeps the canvas square.
 * Returns the picture unchanged if it cannot be processed.
 */
export async function recolorToCoral(image: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const ink = Math.min(1, Math.max(0, (PAPER_LUM - lum) / (PAPER_LUM - LINE_LUM)));
      data[i] = CORAL.r;
      data[i + 1] = CORAL.g;
      data[i + 2] = CORAL.b;
      data[i + 3] = Math.round(data[i + 3] * ink);
    }
    return await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 92, alphaQuality: 100 })
      .toBuffer();
  } catch (err) {
    console.error("recolor-illustration: left as generated", err);
    return image;
  }
}
