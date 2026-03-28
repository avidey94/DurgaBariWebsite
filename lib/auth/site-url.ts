const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

let warnedAboutProductionFallback = false;

const ensureProtocol = (rawValue: string): string => {
  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  const hostnameCandidate = rawValue.split("/")[0]?.split(":")[0]?.toLowerCase() ?? "";
  const protocol = LOCAL_HOSTNAMES.has(hostnameCandidate) ? "http" : "https";

  return `${protocol}://${rawValue}`;
};

const toOrigin = (rawValue: string): string | null => {
  const prepared = ensureProtocol(rawValue.trim());

  try {
    return new URL(prepared).origin;
  } catch {
    return null;
  }
};

const resolveSiteUrl = (): string => {
  const fromPublicSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromPublicSite) {
    const normalized = toOrigin(fromPublicSite);
    if (normalized) return normalized;
  }

  const fromVercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (fromVercel) {
    const normalized = toOrigin(fromVercel);
    if (normalized) return normalized;
  }

  if (process.env.NODE_ENV === "production" && !warnedAboutProductionFallback) {
    warnedAboutProductionFallback = true;
    console.warn(
      "[auth] Falling back to http://localhost:3000 because NEXT_PUBLIC_SITE_URL and VERCEL_URL are not set.",
    );
  }

  return "http://localhost:3000";
};

export const getSiteUrl = (): string => resolveSiteUrl();

export const normalizeNextPath = (nextPath: string | null | undefined): string => {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/portal";
  }

  return nextPath;
};

export const buildAuthCallbackUrl = (nextPath = "/portal"): string => {
  const callbackUrl = new URL("/auth/callback", `${getSiteUrl()}/`);
  callbackUrl.searchParams.set("next", normalizeNextPath(nextPath));
  return callbackUrl.toString();
};
