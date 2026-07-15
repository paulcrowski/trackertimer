const helperKeyHashAlgorithm = 'SHA-256';

export function issueDesktopHelperKey() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '');
}

export async function hashDesktopHelperKey(helperKey: string) {
  const digest = await crypto.subtle.digest(
    helperKeyHashAlgorithm,
    new TextEncoder().encode(helperKey),
  );

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
