/**
 * Flow account helpers — passkey / WebAuthn utilities.
 *
 * These run in the browser.
 * The resulting publicKeyHex is sent to the backend (flow_service.py),
 * which creates the on-chain Flow account and registers the key.
 *
 * The private key NEVER leaves the device secure enclave.
 * The user never sees a seed phrase.
 */

/**
 * Generates a P-256 (ES256) passkey for a new CoopWise user.
 * Uses the browser's WebAuthn / Web Crypto API.
 * The key lives in the device's secure enclave (Touch ID / Face ID).
 *
 * @param email - used as the WebAuthn user identifier
 * @param challenge - random bytes from the backend (prevents replay attacks)
 * @returns { credentialId, publicKeyHex } to send to the backend
 */
export async function generatePasskeyForUser(
  email: string,
  challenge: Uint8Array
): Promise<{ credentialId: string; publicKeyHex: string }> {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: "CoopWise",
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(email),
        name: email,
        displayName: email,
      },
      // ES256 = P-256 — the same curve Flow uses for account keys
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // device biometric only (no USB keys)
        userVerification: "required",        // always require Face ID / Touch ID
        residentKey: "preferred",
      },
      timeout: 60000,
    },
  })) as PublicKeyCredential;

  if (!credential) {
    throw new Error("Passkey creation failed or was cancelled by the user.");
  }

  const response = credential.response as AuthenticatorAttestationResponse;

  // Extract the raw public key bytes from the CBOR-encoded attestation object
  const publicKeyBytes = extractP256PublicKeyBytes(response);
  const publicKeyHex = bytesToHex(publicKeyBytes);
  const credentialId = bufferToBase64Url(credential.rawId);

  return { credentialId, publicKeyHex };
}

/**
 * Signs a challenge with an existing passkey credential.
 * Used for future "re-auth" flows (e.g. confirming a large payout).
 */
export async function signWithPasskey(
  challenge: Uint8Array,
  credentialId: string
): Promise<{ signature: string; authenticatorData: string }> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          type: "public-key",
          id: base64UrlToBuffer(credentialId),
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  })) as PublicKeyCredential;

  const response = assertion.response as AuthenticatorAssertionResponse;

  return {
    signature: bytesToHex(new Uint8Array(response.signature)),
    authenticatorData: bytesToHex(new Uint8Array(response.authenticatorData)),
  };
}

/** Returns true if the browser supports WebAuthn passkeys */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
      "function"
  );
}

/** Async check — returns true if the device has a platform authenticator (Face ID, Touch ID, Windows Hello) */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isPasskeySupported()) return false;
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

//
// Internal helpers
//

/**
 * Extracts the raw P-256 public key bytes (65 bytes: 0x04 || x || y)
 * from the WebAuthn attestation response's CBOR-encoded public key.
 * This is the format Flow expects when registering an account key.
 */
function extractP256PublicKeyBytes(
  response: AuthenticatorAttestationResponse
): Uint8Array {
  // The public key is available via getPublicKey() in modern browsers
  const rawKey = response.getPublicKey?.();
  if (rawKey) {
    // DER-encoded SubjectPublicKeyInfo — the public key is the last 65 bytes
    const keyBytes = new Uint8Array(rawKey);
    // Strip the DER prefix (27 bytes for P-256) to get the raw 65-byte key
    return keyBytes.slice(keyBytes.length - 65);
  }

  // Fallback: parse the attestationObject manually (CBOR)
  // This path should not be needed in modern browsers (Chrome 108+, Safari 16+, Firefox 119+)
  throw new Error(
    "getPublicKey() not supported. Please use a modern browser (Chrome 108+, Safari 16+)."
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const str = atob(base64);
  const buffer = new ArrayBuffer(str.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i);
  return buffer;
}
