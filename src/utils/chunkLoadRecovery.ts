const CHUNK_RELOAD_KEY = 'sleepersheets:chunk-reload-attempted';

const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
  /dynamically imported module/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
];

const isChunkLoadError = (error: unknown): boolean => {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : String(error ?? '');

  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

const attemptSingleReload = () => {
  if (typeof window === 'undefined') return;

  const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
  if (alreadyReloaded) return;

  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  window.location.reload();
};

export const setupChunkLoadRecovery = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) return;
    event.preventDefault();
    attemptSingleReload();
  });

  window.addEventListener('error', (event) => {
    if (!isChunkLoadError(event.error ?? event.message)) return;
    attemptSingleReload();
  });

  // Vite emits this when a preloaded chunk cannot be fetched.
  window.addEventListener('vite:preloadError', (event: Event) => {
    const customEvent = event as CustomEvent & { payload?: unknown };
    if (!isChunkLoadError(customEvent.payload ?? customEvent.detail)) return;
    event.preventDefault();
    attemptSingleReload();
  });
};
