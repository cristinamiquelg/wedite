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

NO FILLS, NO SOLID INK (very important)
- Nothing is filled. Every shape is drawn as an OUTLINE and its inside stays empty and transparent. No solid or blacked-in areas of any size: not in the hair, not in the mouth or eyes, not in clothes, shoes, objects, shadows or under the chin. No beige / cream / peach / pink patches, no blobs of ink, no shading, no gradients, no cross-hatching, no dense masses of parallel strokes, no shadows.
- Hair is NEVER a dark mass: draw it as an outline of its shape plus a limited number of separate, flowing strand lines with clear empty space between them, as the woman's hair in the second image.
- Where the photograph is dark (hair, shadows, a dark garment), leave it empty and suggest it with a few lines only.

COLOUR
- One single flat colour for every line: Ribera coral red, exactly #DD3E3E (RGB 221, 62, 62), the same red as the three drawings of the second image. Not orange, not vermilion, not salmon, not pink, not brick. No black, no grey, no second colour, no tints.

SUBJECT
- Stay faithful to the photograph: the pose, how the people sit or stand relative to each other, their proportions, their hairstyles, their clothes and the objects they hold. They must be recognisable as this couple through silhouette, clothes and gesture.
- Faces: simple, calm, natural and flattering, with true-to-life proportions (never enlarged eyes, never exaggerated features, never a caricature or a cartoon). Use very few lines: a small curved line per eye with a tiny pupil dot, light eyebrows, a short nose line, a mouth drawn with one or two thin lines (a gentle smile if the person smiles). Keep both eyes the same size and the face symmetrical in its own perspective. For babies and young children use soft round cheeks and a small nose and mouth, with eyes no bigger than an adult's relative to the face. If a hand, toy or object covers part of the face, simply draw the outline of the hand and the object in front and leave the face's hidden part out. People seen from behind need no face.
- The people are the only subject. Leave out the room, furniture, wallpaper, curtains, carpet and every other element of the photograph's background.

GROUND
- Below the figures draw a few loose, horizontal ground strokes of different lengths (short dashes and a couple of longer lines), exactly like the strokes under the church and the bus in the second image, so the figures sit on something. Nothing else: no sky, no clouds, no horizon, no hills, no trees, no scenery, no floating strokes in the air.

CANVAS
- A SQUARE canvas (1:1). The WHOLE drawing, ground strokes included, is centred and fits inside the middle 70% of the canvas, leaving an empty margin of at least 15% of the canvas on every side. No part of any figure touches, crowds or is cut by the edge; if the photograph is cropped tightly, show the figures a little smaller and complete (draw the lower part of the arms and clothes as an open, fading outline) rather than running out of the canvas.
- Transparent background. No frame, no border, no text, no signature, no paper texture, no photographic lighting.

Final check before you answer: bold-to-fine brush-pen strokes with tapered ends and detailed hair and clothes folds, no solid ink anywhere (hair as separate strands), simple natural faces, only the colour #DD3E3E, square canvas with a generous margin on every side, a few ground strokes underneath, and it sits naturally next to the church, the woman and the bus of the second image.`;
