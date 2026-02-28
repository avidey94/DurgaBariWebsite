export const parsePageVisibility = (content: string | null | undefined, fallback = false) => {
  if (!content) return fallback;

  try {
    const parsed = JSON.parse(content) as { isPublic?: unknown };
    return parsed.isPublic === true;
  } catch {
    return fallback;
  }
};
