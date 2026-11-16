export function isSafeGovLink(value) {
  if (typeof value !== "string") return false;
  const candidate = value.trim();
  if (!/^https:\/\//i.test(candidate)) return false;

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (hostname.endsWith(".gov.in") || hostname.endsWith(".nic.in"))
    );
  } catch {
    return false;
  }
}

export function getSafeGovUrl(value) {
  if (!isSafeGovLink(value)) return null;
  return new URL(value.trim()).href;
}
