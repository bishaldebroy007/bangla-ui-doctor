import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTNAME_PATTERN =
  /^(localhost|.*\.localhost|.*\.local|.*\.internal|metadata\.google\.internal|instance-data|0\.0\.0\.0)$/i;

const SYNTHETIC_DEMO_PATTERN = /\.demo$/i;

export class SsrfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfValidationError";
  }
}

export function isSyntheticDemoUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return SYNTHETIC_DEMO_PATTERN.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase().replace(/^\[|\]$/g, "");

  // Handle IPv4-mapped IPv6 addresses like ::ffff:127.0.0.1 or ::ffff:7f00:1
  if (normalized.startsWith("::ffff:")) {
    const tail = normalized.slice(7);
    if (isIP(tail) === 4) {
      return isPrivateOrReservedIpv4(tail);
    }
    // Hex form ::ffff:7f00:0001
    const hexMatch = tail.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hexMatch) {
      const hi = parseInt(hexMatch[1], 16);
      const lo = parseInt(hexMatch[2], 16);
      const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      return isPrivateOrReservedIpv4(ipv4);
    }
  }

  const family = isIP(normalized);
  if (family === 4) {
    return isPrivateOrReservedIpv4(normalized);
  }
  if (family === 6) {
    return isPrivateOrReservedIpv6(normalized);
  }
  return true;
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b, c] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments) & 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved / Broadcast)
  if (a >= 224) return true;

  return false;
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  if (ip === "::" || ip === "::1") return true;
  // Unique local addresses (fc00::/7 -> fc00..fdff)
  if (/^f[cd][0-9a-f]{2}:/i.test(ip) || /^f[cd]/i.test(ip)) return true;
  // Link-local unicast (fe80::/10 -> fe80..febf)
  if (/^fe[89ab][0-9a-f]?:/i.test(ip)) return true;
  // Multicast (ff00::/8)
  if (/^ff/i.test(ip)) return true;
  // Documentation (2001:db8::/32)
  if (/^2001:0?db8:/i.test(ip)) return true;
  return false;
}

/**
 * Validates that a URL uses HTTP/HTTPS, does not point to a blocked hostname,
 * and resolves strictly to public IP addresses via DNS lookup.
 */
export async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new SsrfValidationError("Invalid URL syntax.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfValidationError("Only http:// and https:// URLs are allowed.");
  }

  if (parsed.username || parsed.password) {
    throw new SsrfValidationError("URLs containing embedded credentials are not allowed.");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname) {
    throw new SsrfValidationError("URL must include a valid hostname.");
  }

  if (BLOCKED_HOSTNAME_PATTERN.test(hostname)) {
    throw new SsrfValidationError(`Scanning internal or local host "${hostname}" is forbidden.`);
  }

  // If the hostname is an IP literal, check directly
  if (isIP(hostname) !== 0) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new SsrfValidationError(`Scanning private or reserved IP "${hostname}" is forbidden.`);
    }
    return parsed;
  }

  // Synthetic controlled demo fixtures (.demo) are handled in-memory without network I/O
  if (SYNTHETIC_DEMO_PATTERN.test(hostname)) {
    return parsed;
  }

  // Resolve all A / AAAA records via system DNS and verify every returned IP is public
  let records: { address: string; family: number }[];
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SsrfValidationError(
      `Could not resolve DNS for "${hostname}". Verify that the domain is publicly reachable.`
    );
  }

  if (!records || records.length === 0) {
    throw new SsrfValidationError(`No DNS records found for "${hostname}".`);
  }

  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      throw new SsrfValidationError(
        `Host "${hostname}" resolves to a private or reserved IP address (${record.address}), which is blocked for security.`
      );
    }
  }

  return parsed;
}
