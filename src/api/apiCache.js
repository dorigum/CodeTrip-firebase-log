import { get, ref, set } from 'firebase/database';
import { firebaseAuth, realtimeDb } from '../firebase';

const memoryCache = new Map();
const LOCAL_PREFIX = 'codetrip_api_cache_';

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const hashKey = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const makeCacheKey = (parts) => {
  const rawKey = stableStringify(parts);
  return `${parts.scope || 'api'}_${hashKey(rawKey)}`;
};

const isFresh = (entry, now = Date.now()) =>
  entry?.expiresAt && Number(entry.expiresAt) > now && Object.prototype.hasOwnProperty.call(entry, 'data');

const readLocal = (cacheKey) => {
  if (!hasStorage()) return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${cacheKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(`${LOCAL_PREFIX}${cacheKey}`);
    return null;
  }
};

const writeLocal = (cacheKey, entry) => {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${cacheKey}`, JSON.stringify(entry));
  } catch {
    // Ignore quota errors. Realtime Database cache still works.
  }
};

const canUseRemoteCache = () => !!firebaseAuth.currentUser;

const readRemote = async (cacheKey) => {
  if (!canUseRemoteCache()) return null;

  const snapshot = await get(ref(realtimeDb, `apiCache/${cacheKey}`));
  return snapshot.exists() ? snapshot.val() : null;
};

const writeRemote = async (cacheKey, entry) => {
  if (!canUseRemoteCache()) return;

  try {
    await set(ref(realtimeDb, `apiCache/${cacheKey}`), entry);
  } catch (error) {
    console.warn('Failed to write API cache:', error);
  }
};

export const cachedApiRequest = async ({ scope, service, params = {}, ttlMs, fetcher }) => {
  const cacheKey = makeCacheKey({ scope, service, params });
  const now = Date.now();

  const memoryEntry = memoryCache.get(cacheKey);
  if (isFresh(memoryEntry, now)) return memoryEntry.data;

  const localEntry = readLocal(cacheKey);
  if (isFresh(localEntry, now)) {
    memoryCache.set(cacheKey, localEntry);
    return localEntry.data;
  }

  let remoteEntry = null;
  try {
    remoteEntry = await readRemote(cacheKey);
    if (isFresh(remoteEntry, now)) {
      memoryCache.set(cacheKey, remoteEntry);
      writeLocal(cacheKey, remoteEntry);
      return remoteEntry.data;
    }
  } catch (error) {
    console.warn('Failed to read API cache:', error);
  }

  try {
    const data = await fetcher();
    const nextEntry = {
      data,
      expiresAt: now + ttlMs,
      updatedAt: now,
    };
    memoryCache.set(cacheKey, nextEntry);
    writeLocal(cacheKey, nextEntry);
    writeRemote(cacheKey, nextEntry);
    return data;
  } catch (error) {
    const staleEntry = remoteEntry || localEntry || memoryEntry;
    if (staleEntry && Object.prototype.hasOwnProperty.call(staleEntry, 'data')) {
      console.warn('Using stale API cache after request failure:', error);
      return staleEntry.data;
    }
    throw error;
  }
};

