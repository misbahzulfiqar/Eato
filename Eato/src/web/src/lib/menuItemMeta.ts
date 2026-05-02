type EmbeddedMeta = {
  addons?: unknown;
  images?: string[];
};

const META_RE = /\n\n<!--meta:(.+?)-->\s*$/s;
const LEGACY_ADDONS_RE = /\n\n<!--addons:(.+?)-->\s*$/s;

export type ParsedMenuMeta = {
  cleanDescription: string;
  addonsRaw: unknown[];
  images: string[];
};

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function cleanImageList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .slice(0, 24);
}

export function parseMenuDescriptionWithMeta(description: string): ParsedMenuMeta {
  const source = description || '';
  const modern = source.match(META_RE);
  if (modern) {
    const parsed = safeJsonParse<EmbeddedMeta>(modern[1], {});
    const clean = source.slice(0, modern.index).trim();
    return {
      cleanDescription: clean,
      addonsRaw: Array.isArray(parsed.addons) ? parsed.addons : [],
      images: cleanImageList(parsed.images),
    };
  }

  const legacy = source.match(LEGACY_ADDONS_RE);
  if (legacy) {
    return {
      cleanDescription: source.slice(0, legacy.index).trim(),
      addonsRaw: safeJsonParse<unknown[]>(legacy[1], []),
      images: [],
    };
  }

  return { cleanDescription: source.trim(), addonsRaw: [], images: [] };
}

export function buildMenuDescriptionWithMeta(
  description: string,
  addonsRaw: unknown[],
  images: string[],
): string {
  const cleanDescription = (description || '').trim();
  const cleanImages = cleanImageList(images);
  const hasAddons = Array.isArray(addonsRaw) && addonsRaw.length > 0;
  const hasImages = cleanImages.length > 0;
  if (!hasAddons && !hasImages) return cleanDescription;

  const meta: EmbeddedMeta = {};
  if (hasAddons) meta.addons = addonsRaw;
  if (hasImages) meta.images = cleanImages;
  return `${cleanDescription}\n\n<!--meta:${JSON.stringify(meta)}-->`.trim();
}
