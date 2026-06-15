/** Build id baked in at compile time (GitHub Actions sets VITE_BUILD_ID). */
export const APP_BUILD_ID = import.meta.env.VITE_BUILD_ID || 'local';

export function getVersionManifestUrl() {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}version.json`;
}

export function isUpdateAvailable(remoteBuildId, localBuildId = APP_BUILD_ID) {
  if (!remoteBuildId || !localBuildId) return false;
  return remoteBuildId !== localBuildId;
}

export async function fetchRemoteBuildId() {
  const res = await fetch(getVersionManifestUrl(), {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.buildId ?? null;
}

export async function isNewVersionAvailable() {
  try {
    const remoteBuildId = await fetchRemoteBuildId();
    return isUpdateAvailable(remoteBuildId);
  } catch {
    return false;
  }
}

export function reloadApp() {
  window.location.reload();
}
