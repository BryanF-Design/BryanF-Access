import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

type EncryptedSecret = {
  secret_encrypted: string;
  secret_iv: string;
  secret_tag: string;
};

type StoredSecret = {
  secret_encrypted: string | null;
  secret_iv: string | null;
  secret_tag: string | null;
};

function getCredentialKey() {
  const secret =
    process.env.CREDENTIALS_ENCRYPTION_KEY ??
    process.env.ADMIN_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || secret.length < 16) {
    throw new Error("Missing CREDENTIALS_ENCRYPTION_KEY for credential encryption.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptCredentialSecret(value: string): EncryptedSecret {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getCredentialKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    secret_encrypted: encrypted.toString("base64"),
    secret_iv: iv.toString("base64"),
    secret_tag: tag.toString("base64"),
  };
}

export function decryptCredentialSecret(secret: StoredSecret) {
  if (!secret.secret_encrypted || !secret.secret_iv || !secret.secret_tag) {
    return null;
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getCredentialKey(),
    Buffer.from(secret.secret_iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(secret.secret_tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(secret.secret_encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
