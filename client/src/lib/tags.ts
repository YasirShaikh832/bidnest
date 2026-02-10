export function normalizeTag(t: string): string {
  return t
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeTagsInput(input: string): string[] {
  if (!input.trim()) return [];
  const list = input.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
  return Array.from(new Set(list.map(normalizeTag).filter(Boolean)));
}
