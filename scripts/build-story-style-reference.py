"""Rebuilds src/lib/story-style-reference.ts: the style sheet that travels with every story-illustration
request (see src/lib/story-illustration-prompt.ts).

Input: the reference drawings in scripts/story-style-sources/ (red ink on black, drawn for Ribera).
Output: the three of them recoloured to Ribera's coral (#DD3E3E) on white, one per square cell, side by side.

    python3 scripts/build-story-style-reference.py
"""
import base64
import io
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = ["iglesia.webp", "mujer-de-espaldas.webp", "autobus.webp"]
CORAL = (0xDD, 0x3E, 0x3E)
CELL = 640
PAD = 36


def ink_cell(path: pathlib.Path) -> Image.Image:
    src = Image.open(path).convert("RGB")
    # Red channel = how much ink there is (the lines are red on black).
    alpha = src.getchannel("R").point(lambda v: min(255, int(v * 255 / CORAL[0])))
    alpha = alpha.point(lambda v: 0 if v < 24 else v)
    box = alpha.getbbox()
    alpha = alpha.crop(box)
    scale = min((CELL - 2 * PAD) / alpha.width, (CELL - 2 * PAD) / alpha.height)
    alpha = alpha.resize((round(alpha.width * scale), round(alpha.height * scale)), Image.LANCZOS)
    cell = Image.new("RGB", (CELL, CELL), "white")
    ink = Image.new("RGB", alpha.size, CORAL)
    cell.paste(ink, ((CELL - alpha.width) // 2, (CELL - alpha.height) // 2), alpha)
    return cell


sheet = Image.new("RGB", (CELL * len(SOURCES), CELL), "white")
for i, name in enumerate(SOURCES):
    sheet.paste(ink_cell(ROOT / "scripts" / "story-style-sources" / name), (i * CELL, 0))

buf = io.BytesIO()
sheet.quantize(colors=24).save(buf, "PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()

(ROOT / "src" / "lib" / "story-style-reference.ts").write_text(
    "// Style sheet for the story illustration: three of Ribera's own drawings (a church, a woman seen from\n"
    "// behind, a bus), recoloured to the template's coral on white, one per square cell. It travels with every\n"
    "// illustration request as the second input image so the generated drawing matches their brush-pen line,\n"
    "// colour and level of detail. Regenerate with `python3 scripts/build-story-style-reference.py`.\n"
    f'export const STORY_STYLE_REFERENCE_PNG_BASE64 =\n  "{b64}";\n'
)
print("sheet", sheet.size, "png bytes", len(buf.getvalue()))
