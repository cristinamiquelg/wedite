// Prompt sent to OpenAI's image-edit endpoint, together with two input images:
//   1. the photo the user picked (what to draw: people, an object, a place, a pet…), and
//   2. a style sheet with three of the template's own drawings (how to draw it;
//      see story-style-reference.ts).
// Turns the photo into the line illustration shown in "Nuestra historia".
//
// It must never invent: whatever the photo shows is what gets drawn (a balloon is drawn as a balloon,
// never as a couple). `subjects` is a short description of the photo's main subjects, made by a vision
// model just before (see the route); it is added so the drawing is anchored to what is really there.
export function buildStoryIllustrationPrompt(subjects?: string | null): string {
  const grounded = subjects
    ? `\n\nWHAT THE PHOTOGRAPH SHOWS (a description written by someone looking at it): ${subjects}\nDraw exactly this and nothing else.`
    : "";
  return `Redraw the FIRST image (a photograph) as a hand-inked brush-pen line illustration, drawn by the same illustrator as the three drawings in the SECOND image.

THE ONE RULE THAT COMES BEFORE EVERYTHING: DRAW ONLY WHAT IS IN THE PHOTOGRAPH
- The subject can be anything: one or more people, a pet, a single object (a balloon, a flower, a car), a building, a landscape. Draw exactly that subject, with the same number of subjects, in the same pose and arrangement.
- NEVER add people, couples, babies, hands, faces, animals or objects that are not in the photograph. NEVER turn an object or a place into people. If the photograph shows only an object, the illustration shows only that object. If it shows one person, draw one person. If it shows two people, draw two.
- Do not draw "a couple", a wedding scene or anything you imagine the photograph is for. Do not draw anything from the second image: its subjects (a church, a woman seen from behind, a bus) must NOT appear in your drawing.${grounded}

The SECOND image is a style sheet. Use it ONLY as a style reference: copy its linework, its colour, its level of detail and the way its drawings are composed. The result must look like a fourth drawing from the same set.

LINEWORK (match the second image closely)
- Confident, loose brush-pen / ink-marker lines drawn quickly by hand, with VARIABLE line weight: the outer contour of each shape is drawn with a bolder stroke, and the interior details with finer, lighter strokes. Strokes start and end with tapered, slightly rough, dry-brush ends. A line is often drawn twice, or as a double line, to give a form its thickness (a collar, a cuff, a roof edge, a rim).
- Slightly imperfect and organic: lines overshoot at corners, do not always close, and have a little wobble. Never vector-perfect, never mechanical, never uniform and thin like a technical pen.
- Rich but selective interior detail, as in the references: the structure and characteristic details of whatever is drawn (folds and seams of clothes, strands of hair, panels and rims of objects, leaves and petals of plants, windows and tiles of buildings), drawn with short curved strokes that follow the form, never by shading.
- Show only the lines that matter: let some contours break open, as the references do, so the drawing breathes.

NO FILLS, NO SOLID INK (very important)
- Nothing is filled. Every shape is drawn as an OUTLINE and its inside stays empty and transparent. No solid or blacked-in areas of any size, not in hair, mouths, eyes, clothes, objects or shadows. No beige / cream / peach / pink patches, no blobs of ink, no shading, no gradients, no cross-hatching, no dense masses of parallel strokes, no shadows.
- Hair is NEVER a dark mass: draw it as an outline of its shape plus a limited number of separate, flowing strand lines with clear empty space between them, as the woman's hair in the second image.
- Where the photograph is dark, leave it empty and suggest it with a few lines only.

COLOUR
- One single flat colour for every line: Ribera coral red, exactly #DD3E3E (RGB 221, 62, 62), the same red as the three drawings of the second image. Not orange, not vermilion, not salmon, not pink, not brick. No black, no grey, no second colour, no tints.

IF THERE ARE PEOPLE (only then)
- Stay faithful to the photograph: the pose, how they sit or stand relative to each other, their proportions, hairstyles, clothes and the objects they hold. They must be recognisable through silhouette, clothes and gesture.
- Faces: simple, calm, natural and flattering, with true-to-life proportions (never enlarged eyes, never exaggerated features, never a caricature or a cartoon). Use very few lines: a small curved line per eye with a tiny pupil dot, light eyebrows, a short nose line, a mouth drawn with one or two thin lines (a gentle smile if the person smiles). Keep both eyes the same size and the face symmetrical in its own perspective. For babies and young children use soft round cheeks and a small nose and mouth. If a hand, toy or object covers part of the face, simply draw the outline of the hand and the object in front and leave the hidden part out. People seen from behind need no face.

BACKGROUND AND GROUND
- Leave out the room, furniture, wallpaper, curtains, sky and every other element of the photograph's background.
- Below the subject draw a few loose, horizontal ground strokes of different lengths (short dashes and a couple of longer lines), exactly like the strokes under the church and the bus in the second image, so it sits on something. Nothing else: no clouds, no horizon, no hills, no trees, no scenery, no floating strokes in the air.

CANVAS
- A SQUARE canvas (1:1). The WHOLE drawing, ground strokes included, is centred and fits inside the middle 70% of the canvas, leaving an empty margin of at least 15% of the canvas on every side. Nothing touches, crowds or is cut by the edge; if the photograph is cropped tightly, show the subject a little smaller and complete (draw the lower part of arms and clothes as an open, fading outline) rather than running out of the canvas.
- Transparent background. No frame, no border, no text, no signature, no paper texture, no photographic lighting.

Final check before you answer: does the drawing show ONLY what is in the photograph (nothing added, nothing turned into something else), in bold-to-fine brush-pen strokes with tapered ends, no solid ink anywhere, only the colour #DD3E3E, on a square canvas with a generous margin, with a few ground strokes underneath, looking like the church, the woman and the bus of the second image?`;
}
