const STORAGE_KEY = "e4c_biometric";
const SALT = "e4c-biometric";
const PBKDF2_ITERATIONS = 100_000;

interface BiometricSession {
  credentialId: string;
  iv: string;
  ciphertext: string;
}

export interface RawSession {
  usuario: string;
  contrasena: string;
  workspace: string;
  empresa_id: string;
  sucursal: string;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function deriveKey(credentialId: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(credentialId),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function save(credentialId: string, session: RawSession): Promise<void> {
  const key = await deriveKey(credentialId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(session));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  const stored: BiometricSession = {
    credentialId,
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
    ciphertext: bufferToBase64(ciphertext),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export async function load(): Promise<{ credentialId: string; session: RawSession } | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored: BiometricSession = JSON.parse(raw);
    const key = await deriveKey(stored.credentialId);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBuffer(stored.iv) },
      key,
      base64ToBuffer(stored.ciphertext)
    );
    const session: RawSession = JSON.parse(new TextDecoder().decode(plaintext));
    return { credentialId: stored.credentialId, session };
  } catch {
    return null;
  }
}

export function clear(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSession(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
