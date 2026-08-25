/**
 * Extracts clean, readable 2-letter uppercase initials from any person or role name.
 * Robustly filters out symbols like '/', '-', '&', '(', ')', '|'.
 *
 * @example
 * getInitials("Manager / Owner") => "MO"
 * getInitials("Ahmad Syahripudin") => "AS"
 * getInitials("Head Chef / Barista") => "HC"
 * getInitials("Kasir Front POS") => "KF"
 * getInitials("Budi") => "BU"
 * getInitials("") => "ST"
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'ST';

  // Extract clean alphanumeric words (filtering punctuation & slashes)
  const cleanWords = name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0);

  if (cleanWords.length === 0) return 'ST';
  if (cleanWords.length === 1) {
    const word = cleanWords[0];
    return (word.length >= 2 ? word.substring(0, 2) : word + word).toUpperCase();
  }

  return (cleanWords[0][0] + cleanWords[1][0]).toUpperCase();
}
