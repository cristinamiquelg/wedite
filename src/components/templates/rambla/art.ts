// Geometry of the Rambla hero drawing (public/rambla/pareja.webp): the couple, each holding a frame in front of
// their face. The frames are empty (transparent) in the drawing; the photos of the couple as children sit BEHIND
// it, clipped to the frame's opening and tilted like the frame. Measured from the original artwork.
// `clip` is the opening as a polygon in % of the drawing; the photo box is centred on (cx, cy) in % of the
// drawing's width/height, and is w x h in % of the drawing's WIDTH, rotated `rotate` degrees.
export const ART_ASPECT = 2085 / 1545;

export const FRAMES = [
  {
    clip: "polygon(24.892% 8.544%, 26.906% 7.767%, 28.058% 7.767%, 39.137% 11.456%, 42.59% 13.981%, 42.59% 16.311%, 42.014% 24.272%, 40.0% 35.34%, 39.281% 35.728%, 38.129% 35.728%, 31.223% 34.563%, 22.014% 32.039%, 20.0% 29.515%, 20.0% 27.961%, 20.576% 24.466%, 23.165% 11.262%)",
    cx: 31.71,
    cy: 22.09,
    w: 24.71,
    h: 22.46,
    rotate: 13.68,
  },
  {
    clip: "polygon(74.245% 14.951%, 76.835% 24.272%, 78.273% 35.34%, 78.273% 36.893%, 77.122% 41.553%, 61.007% 42.913%, 58.849% 42.718%, 57.698% 41.553%, 56.403% 29.709%, 55.971% 19.417%, 58.993% 17.282%, 70.935% 13.981%, 72.086% 13.981%)",
    cx: 66.80,
    cy: 29.65,
    w: 25.21,
    h: 25.23,
    rotate: -10.94,
  },
] as const;
