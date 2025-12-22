import crypto from 'crypto';

const KEY_ENV = process.env.TOKEN_ENCRYPTION_KEY || '';

if (!KEY_ENV) {
  console.warn('TOKEN_ENCRYPTION_KEY not set — tokens will not be encrypted.');
}

function getKey() {
  // Expect base64-encoded 32-byte key in env
  try {
    return Buffer.from(KEY_ENV, 'base64');
  } catch (err) {
    return Buffer.from(KEY_ENV);
  }
}

export async function encryptText(plain: string) {
  const key = getKey();
  if (!key || key.length < 16) return plain; // no-op if key missing

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export async function decryptText(ciphertext: string) {
  const key = getKey();
  if (!key || key.length < 16) return ciphertext; // no-op

  try {
    const b = Buffer.from(ciphertext, 'base64');
    const iv = b.slice(0, 12);
    const tag = b.slice(12, 28);
    const data = b.slice(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Failed to decrypt token payload', err);
    return ciphertext;
  }
}

export default { encryptText, decryptText };
