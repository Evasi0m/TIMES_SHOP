import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  APP_BUILD_ID,
  fetchRemoteBuildId,
  getVersionManifestUrl,
  isNewVersionAvailable,
  isUpdateAvailable,
} from './appVersion.js';

describe('isUpdateAvailable', () => {
  it('returns true when build ids differ', () => {
    expect(isUpdateAvailable('abc123', 'def456')).toBe(true);
  });

  it('returns false when build ids match', () => {
    expect(isUpdateAvailable('abc123', 'abc123')).toBe(false);
  });

  it('returns false when remote build id is missing', () => {
    expect(isUpdateAvailable(null, 'abc123')).toBe(false);
    expect(isUpdateAvailable('', 'abc123')).toBe(false);
  });

  it('returns false when local build id is missing', () => {
    expect(isUpdateAvailable('abc123', null)).toBe(false);
    expect(isUpdateAvailable('abc123', '')).toBe(false);
  });
});

describe('getVersionManifestUrl', () => {
  it('points at version.json under the app base path', () => {
    expect(getVersionManifestUrl()).toBe('/TIMES_SHOP/version.json');
  });
});

describe('fetchRemoteBuildId', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ buildId: 'remote-sha' }),
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns buildId from version.json', async () => {
    await expect(fetchRemoteBuildId()).resolves.toBe('remote-sha');
    expect(fetch).toHaveBeenCalledWith('/TIMES_SHOP/version.json', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
  });

  it('returns null when fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false });
    await expect(fetchRemoteBuildId()).resolves.toBeNull();
  });

  it('returns null when response has no buildId', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
    await expect(fetchRemoteBuildId()).resolves.toBeNull();
  });
});

describe('isNewVersionAvailable', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));
    await expect(isNewVersionAvailable()).resolves.toBe(false);
  });

  it('compares remote build id against embedded APP_BUILD_ID', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ buildId: APP_BUILD_ID }),
    });
    await expect(isNewVersionAvailable()).resolves.toBe(false);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ buildId: 'new-deploy-sha' }),
    });
    await expect(isNewVersionAvailable()).resolves.toBe(true);
  });
});
