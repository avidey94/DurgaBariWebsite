export const parseCmsListContent = (contentHtml: string | null | undefined, fallbackItems: string[]) => {
  if (!contentHtml || contentHtml.trim().length === 0) {
    return fallbackItems;
  }

  const raw = contentHtml.trim();

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const items = parsed
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean);

        if (items.length > 0) {
          return items;
        }
      }
    } catch {
      // Fallback to newline parsing below.
    }
  }

  const newlineItems = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return newlineItems.length > 0 ? newlineItems : fallbackItems;
};
