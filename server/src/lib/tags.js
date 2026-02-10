export function normalizeTag(t) {
  return String(t)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeTags(tags) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : String(tags).split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
  return [...new Set(list.map(normalizeTag).filter(Boolean))];
}
