export type StorageMode = 'cloud' | 'local';

export function hasStoredCloudAuthState(args: {
  jwt: string | null;
  refreshToken: string | null;
}) {
  return Boolean(args.jwt || args.refreshToken);
}

export function resolveInitialStorageMode(args: {
  hasCloudAuthState: boolean;
  storedMode: StorageMode | null;
}) {
  if (args.storedMode === 'local') {
    return 'local';
  }
  if (args.storedMode === 'cloud' && args.hasCloudAuthState) {
    return 'cloud';
  }
  return null;
}
