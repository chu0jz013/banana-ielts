export const normalizeAnswer = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ');
