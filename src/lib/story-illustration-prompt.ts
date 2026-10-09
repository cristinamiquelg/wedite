// Prompt sent to OpenAI's image-edit endpoint, together with two input images:
//   1. the couple's photo (what to draw), and
//   2. a style sheet with three of the template's own drawings (how to draw it;
//      see story-style-reference.ts).
// Turns the photo into the line illustration shown in "Nuestra historia".
export const STORY_ILLUSTRATION_PROMPT = `Redraw the FIRST image (a photograph of a couple) as a hand-inked brush-pen line illustration, drawn by the same illustrator as the three drawings in the SECOND image.

The SECOND image is a style sheet with three drawings from the same wedding website: a country church, a woman seen from behind and a vintage bus. Use it ONLY as a style reference: copy their linework, their colour, their level of detail and the way they are composed. Do NOT copy their subjects. The result must look like a fourth drawing from the same set.

LINEWORK (match the second image closely)
- Confident, loose brush-pen / ink-marker lines drawn quickly by hand, with VARIABLE line weight: the outer contour of each shape is drawn with a bolder stroke, and the interior details with finer, lighter strokes. Strokes start and end with tapered, slightly rough, dry-brush ends. A line is often drawn twice, or as a double line, to give a form its thickness (a collar, a cuff, a roof edge, a sleeve).
- Slightly imperfect and organic: lines overshoot at corners, do not always close, and have a little wobble. Never vector-perfect, never mechanical, never uniform and thin like a technical pen.
- Rich but selective interior detail, as in the references: hair drawn as many separate flowing strands that follow its direction (and a few loose stray hairs), folds and creases in the clothes drawn with short curved strokes, collars, cuffs, seams, buttons, small accessories, the shape of hands and fingers. Clothes and hair are described by lines that follow their form, never by shading.
- Show only the lines that matter: let some contours break open, as the references do, so the drawing breathes.

NO FILLS (very important)
- Nothing is filled. No solid colour, no wash, no beige / cream / peach / pink patches behind or inside the figures, no blobs of ink, no shading, no gradients, no cross-hatching, no shadows. Everything inside the outlines stays empty and transparent.

COLOUR
- One single flat colour for every line: Ribera coral red, exactly #DD3E3E (RGB 221, 62, 62), the same red as the three drawings of the second image. Not orange, not vermilion, not salmon, not pink, not brick. No black, no grey, no second colour, no tints.

SUBJECT
- Stay faithful to the photograph: the pose, how the people sit or stand relative to each other, their proportions, their hairstyles, their clothes and the objects they hold. They must be recognisable as this couple through silhouette, clothes and gesture.
- Draw faces simply and with very few lines (eyes, brows, nose, mouth as small confident marks), kept natural and flattering; never a realistic or cartoonish face. People seen from behind need no face.
- The people are the only subject. Leave out the room, furniture, wallpaper, curtains, carpet and every other element of the photograph's background.

GROUND
- Below the figures draw a few loose, horizontal ground strokes of different lengths (short dashes and a couple of longer lines), exactly like the strokes under the church and the bus in the second image, so the figures sit on something. Nothing else: no sky, no clouds, no horizon, no hills, no trees, no scenery, no floating strokes in the air.

CANVAS
- A SQUARE canvas (1:1). The drawing is centred, with its ground strokes included, and fills roughly 75% of the width or height, with an even empty margin around it on every side; nothing touches or is cut by the edge.
- Transparent background. No frame, no border, no text, no signature, no paper texture, no photographic lighting.

Final check before you answer: bold-to-fine brush-pen strokes with tapered ends and detailed hair and clothes folds, nothing filled in, only the colour #DD3E3E, square canvas with generous margin, a few ground strokes underneath, and it sits naturally next to the church, the woman and the bus of the second image.`;
