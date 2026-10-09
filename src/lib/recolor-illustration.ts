import "server-only";

// Ribera's coral, the colour of every line in the template's own illustrations.
const CORAL = { r: 0xdd, g: 0x3e, b: 0x3e };
const SIZE = 1024;
// Empty space kept around the drawing, as a share of the canvas, on every side.
const MARGIN = 0.12;

// Luminance of the coral itself (about 110) and of paper (255). A pixel at or
// below LINE_LUM is ink; one at or above PAPER_LUM is background.
const LINE_LUM = 150;
const PAPER_LUM = 235;
// Opacity below which a pixel counts as empty when measuring the drawing.
const VISIBLE = 24;

/**
 * Makes a generated line drawing exactly Ribera's colour and gives it an even margin: every pixel
 * becomes #DD3E3E and only its "inkness" (how dark it is, times its own transparency) is kept as
 * opacity, which also drops the pale washes the model sometimes adds behind the figures. The drawing
 * is then cropped to its own bounds and centred on a square canvas, so it never touches the edge.
 * Returns the picture unchanged if it cannot be processed.
 */
export async function recolorToCoral(image: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const ink = Math.min(1, Math.max(0, (PAPER_LUM - lum) / (PAPER_LUM - LINE_LUM)));
      data[i] = CORAL.r;
      data[i + 1] = CORAL.g;
      data[i + 2] = CORAL.b;
      data[i + 3] = Math.round(data[i + 3] * ink);
      if (data[i + 3] >= VISIBLE) {
        const p = i / 4;
        const x = p % width;
        const y = (p - x) / width;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return image; // nothing drawn
    const inner = Math.round(SIZE * (1 - 2 * MARGIN));
    const cropped = await sharp(data, { raw: { width, height, channels: 4 } })
      .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
      .resize(inner, inner, { fit: "inside" })
      .png()
      .toBuffer();
    return await sharp({
      create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: cropped, gravity: "centre" }])
      .webp({ quality: 92, alphaQuality: 100 })
      .toBuffer();
  } catch (err) {
    console.error("recolor-illustration: left as generated", err);
    return image;
  }
}
