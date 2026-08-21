function parseAllowedHosts(value = "") {
  return String(value).split(",").map(item => item.trim().toLowerCase()).filter(Boolean);
}

export function assertAllowedDesktopUrl(rawUrl, env = process.env) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("DESKTOP_URL_INVALID");
  }

  const development = env.NODE_ENV === "development";
  const allowedHosts = parseAllowedHosts(env.BALANCERTS_DESKTOP_ALLOWED_HOSTS);
  if (development && (parsed.protocol === "http:" || parsed.protocol === "https:") && ["127.0.0.1", "localhost"].includes(parsed.hostname)) return parsed;
  if (parsed.protocol !== "https:") throw new Error("DESKTOP_URL_HTTPS_REQUIRED");
  if (!allowedHosts.includes(parsed.hostname.toLowerCase())) throw new Error("DESKTOP_URL_HOST_NOT_ALLOWLISTED");
  return parsed;
}

export function canOpenExternalUrl(rawUrl, env = process.env) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const allowedHosts = parseAllowedHosts(env.BALANCERTS_EXTERNAL_LINK_ALLOWED_HOSTS);
  return allowedHosts.includes(parsed.hostname.toLowerCase());
}
