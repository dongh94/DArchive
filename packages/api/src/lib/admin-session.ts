import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME = "darchive_admin_session";

const SESSION_DURATION_SECONDS = 60 * 60 * 12;

type AdminSessionPayload = {
  exp: number;
  iat: number;
  sub: "admin";
};

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAdminSessionCookieValue() {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET or ADMIN_PASSWORD must be configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: "admin",
      iat: now,
      exp: now + SESSION_DURATION_SECONDS,
    } satisfies AdminSessionPayload),
  );

  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminSessionCookieValue(cookieValue: string | undefined) {
  const secret = getSessionSecret();

  if (!secret || !cookieValue) {
    return false;
  }

  const [payload, signature] = cookieValue.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = sign(payload, secret);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.byteLength !== expectedBuffer.byteLength || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const session = JSON.parse(decodeBase64Url(payload)) as Partial<AdminSessionPayload>;
    const now = Math.floor(Date.now() / 1000);

    return session.sub === "admin" && typeof session.exp === "number" && session.exp > now;
  } catch {
    return false;
  }
}

export function getAdminSessionMaxAge() {
  return SESSION_DURATION_SECONDS;
}
