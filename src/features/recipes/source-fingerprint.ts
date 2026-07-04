export function recipeDraftFingerprint(value: string) {
  const normalized = value.trim();
  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `${normalized.length.toString(36)}-${(hash >>> 0).toString(36)}`;
}
