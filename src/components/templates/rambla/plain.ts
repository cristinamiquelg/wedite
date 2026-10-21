// The hand-lettered face of Rambla (Gaegu) draws accented capitals (Á, É, Ñ…) in a different, serif-like hand, which
// looks wrong next to the rest of the word. So everything set in it goes through this: accents, diaeresis, cedilla and
// the tilde of the ñ are dropped ("Sábado" → "Sabado", "Begoña" → "Begona"). Text in the reading font keeps its accents.
export function plain(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
