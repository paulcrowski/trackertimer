export type StorageMode = 'cloud' | 'local';

export const localModeStorageUnavailableMessage =
  'Private local wymaga zapisywalnego localStorage w tej przeglądarce. Włącz storage albo użyj Cloud sync.';

type StorageProbe = Pick<Storage, 'removeItem' | 'setItem'> | null;

function readWindowLocalStorage(): StorageProbe {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function hasStoredCloudAuthState(args: {
  jwt: string | null;
  refreshToken: string | null;
}) {
  return Boolean(args.jwt || args.refreshToken);
}

export function getLocalModeStorageError(storage: StorageProbe = readWindowLocalStorage()) {
  if (!storage) {
    return localModeStorageUnavailableMessage;
  }
  try {
    const probe = '__worktimer_local_mode_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return null;
  } catch {
    return localModeStorageUnavailableMessage;
  }
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
