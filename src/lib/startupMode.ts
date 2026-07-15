import {
  hasLocalModeIndexedDbSupport,
  localModeStorageUnavailableMessage,
} from './localTrackerStore.ts';

export type StorageMode = 'cloud' | 'local';

export function hasStoredCloudAuthState(args: { jwt: string | null; refreshToken: string | null }) {
  return Boolean(args.jwt || args.refreshToken);
}

export { localModeStorageUnavailableMessage };

export function getLocalModeStorageError(hasIndexedDb = hasLocalModeIndexedDbSupport()) {
  if (!hasIndexedDb) {
    return localModeStorageUnavailableMessage;
  }
  return null;
}

export function resolveInitialStorageMode(args: {
  hasCloudAuthState: boolean;
  localModeReady?: boolean;
  storedMode: StorageMode | null;
}) {
  if (args.storedMode === 'local') {
    if (args.localModeReady === false) {
      return null;
    }
    return 'local';
  }
  if (args.storedMode === 'cloud' && args.hasCloudAuthState) {
    return 'cloud';
  }
  return null;
}

export async function signOutToModeChoice(args: {
  clearStoredMode: () => void;
  signOut: () => Promise<unknown>;
}) {
  await args.signOut();
  args.clearStoredMode();
}
