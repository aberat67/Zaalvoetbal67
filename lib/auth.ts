
import { createHmac, timingSafeEqual } from "crypto";

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is niet ingesteld.");
  }

  return secret;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return false;
  }

  const suppliedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);

  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = String(expiresAt);

  const signature = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const [payload, signature] = parts;
    const expiresAt = Number(payload);

    if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) {
      return false;
    }

    const expectedSignature = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    const suppliedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    return (
      suppliedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(suppliedBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
}
